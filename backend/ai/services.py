import re
from datetime import date, timedelta

CATEGORY_KEYWORDS = {
    'Food': ['lunch', 'dinner', 'breakfast', 'food', 'restaurant', 'cafe', 'coffee', 'snack', 'zomato', 'swiggy', 'pizza', 'burger'],
    'Travel': ['uber', 'ola', 'taxi', 'cab', 'bus', 'train', 'flight', 'fuel', 'petrol', 'diesel', 'travel', 'auto', 'rickshaw'],
    'Shopping': ['shopping', 'amazon', 'flipkart', 'clothes', 'shoes', 'myntra', 'mall', 'bought'],
    'Bills': ['bill', 'electricity', 'rent', 'wifi', 'internet', 'recharge', 'phone bill', 'water bill'],
    'Entertainment': ['movie', 'netflix', 'spotify', 'game', 'concert', 'party', 'pvr', 'cinema'],
    'Health': ['medicine', 'doctor', 'hospital', 'pharmacy', 'gym', 'health'],
    'Salary': ['salary', 'stipend', 'paycheck'],
    'Freelance': ['freelance', 'project payment', 'client payment'],
}

LENT_KEYWORDS = ['gave', 'lent', 'paid for', 'sent']
BORROWED_KEYWORDS = ['took', 'borrowed', 'got from', 'received from']

INCOME_KEYWORDS = ['salary', 'got paid', 'received', 'income', 'earned', 'stipend', 'refund']


def _extract_amount(text: str):
    match = re.search(r'(?:rs\.?|₹|inr)?\s?(\d+(?:[.,]\d+)?)\s?(?:rs\.?|₹|inr|rupees)?', text, re.IGNORECASE)
    if match:
        return float(match.group(1).replace(',', ''))
    return None


def _extract_date(text: str):
    text_lower = text.lower()
    today = date.today()
    if 'yesterday' in text_lower:
        return (today - timedelta(days=1)).isoformat()
    if 'tomorrow' in text_lower:
        return (today + timedelta(days=1)).isoformat()
    if 'today' in text_lower:
        return today.isoformat()
    # check for explicit date formats like 2026-06-25 or 25/06/2026
    iso_match = re.search(r'(\d{4}-\d{2}-\d{2})', text)
    if iso_match:
        return iso_match.group(1)
    return today.isoformat()


def _guess_category(text: str, txn_type: str):
    text_lower = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                return category
    return 'Salary' if txn_type == 'income' else 'Other'


def _extract_person(text: str):
    """
    Looks for capitalized words that aren't the first word of the sentence
    and aren't common words — a simple heuristic for names.
    """
    common_words = {'I', 'Today', 'Yesterday', 'Tomorrow', 'Rs', 'Inr'}
    words = text.replace(',', '').split()
    candidates = [w for i, w in enumerate(words) if w[:1].isupper() and w not in common_words and i != 0]
    return candidates[0] if candidates else None


def _extract_person_direction(text: str):
    text_lower = text.lower()
    for kw in LENT_KEYWORDS:
        if kw in text_lower:
            return 'lent'
    for kw in BORROWED_KEYWORDS:
        if kw in text_lower:
            return 'borrowed'
    return None


def _extract_title(text: str, category: str):
    cleaned = text

    # Step 1: Remove amount patterns
    cleaned = re.sub(r'(?:rs\.?|₹|inr)?\s*\d+(?:[.,]\d+)?\s*(?:rs\.?|₹|inr|rupees)?', ' ', cleaned, flags=re.IGNORECASE)

    # Step 2: Remove filler words — replace with a space, not empty string
    filler_words = ['paid', 'for', 'with', 'today', 'yesterday', 'tomorrow',
                    'gave', 'to', 'took', 'from', 'got', 'on', 'the', 'a', 'an', 'i']
    for word in filler_words:
        cleaned = re.sub(rf'\b{word}\b', ' ', cleaned, flags=re.IGNORECASE)

    # Step 3: Remove capitalized words (likely person names)
    cleaned = re.sub(r'\b[A-Z][a-z]+\b', ' ', cleaned)

    # Step 4: Collapse whitespace and strip
    cleaned = re.sub(r'\s+', ' ', cleaned).strip(' .,-')

    words = [w for w in cleaned.split() if len(w) > 1]
    title = ' '.join(words[:5]).strip().capitalize()
    return title if title else category


def parse_transaction_text(text: str) -> dict:
    """
    Rule-based mock parser. Same return shape as the planned Claude-based version,
    so it can be swapped for a real API call later with zero changes elsewhere.
    """
    text = text.strip()
    if not text:
        raise ValueError("Empty input")

    amount = _extract_amount(text)
    if amount is None:
        raise ValueError("Could not find an amount in that text. Try including a number, e.g. '250'.")

    txn_type = 'income' if any(kw in text.lower() for kw in INCOME_KEYWORDS) else 'expense'
    category = _guess_category(text, txn_type)
    txn_date = _extract_date(text)
    person_name = _extract_person(text)
    person_direction = _extract_person_direction(text) if person_name else None
    title = _extract_title(text, category)

    return {
        'title': title,
        'amount': amount,
        'type': txn_type,
        'category_guess': category,
        'date': txn_date,
        'person_name': person_name,
        'person_direction': person_direction,
    }
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .services import parse_transaction_text


class ParseTransactionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'No text provided.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parsed = parse_transaction_text(text)
            return Response(parsed)
        except Exception as e:
            return Response(
                {'error': f'Could not parse that. Try rephrasing. ({str(e)})'},
                status=status.HTTP_400_BAD_REQUEST,
            )
import type { NextApiRequest, NextApiResponse } from 'next';
import { payPayService } from '../../lib/paypay';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { merchantPaymentId } = req.query;

        if (!merchantPaymentId) {
            return res.status(400).json({ error: 'Missing merchantPaymentId parameter' });
        }

        console.log('🧪 Testing PayPay status for:', merchantPaymentId);

        try {
            // Test PayPay API call
            const paymentDetails = await payPayService.getPaymentDetails(merchantPaymentId as string);

            console.log('🔍 Raw PayPay API Response:');
            console.log(JSON.stringify(paymentDetails, null, 2));

            // Return the raw response for debugging
            return res.status(200).json({
                success: true,
                merchantPaymentId: merchantPaymentId,
                rawResponse: paymentDetails,
                resultCode: paymentDetails.resultInfo.code,
                resultMessage: paymentDetails.resultInfo.message,
                paymentStatus: paymentDetails.data?.status || 'No status available',
                paymentData: paymentDetails.data || 'No payment data'
            });

        } catch (paypayError: any) {
            console.error('❌ PayPay API Error:', paypayError);

            return res.status(200).json({
                success: false,
                merchantPaymentId: merchantPaymentId,
                error: paypayError.message,
                errorDetails: paypayError
            });
        }

    } catch (error: any) {
        console.error('❌ Test endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}
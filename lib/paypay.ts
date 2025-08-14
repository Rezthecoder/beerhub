const PAYPAY = require('@paypayopa/paypayopa-sdk-node');

// Configure PayPay SDK
PAYPAY.Configure({
  clientId: process.env.PAYPAY_API_KEY!,
  clientSecret: process.env.PAYPAY_SECRET!,
  merchantId: process.env.PAYPAY_MERCHANT_ID!,
  /* production_mode : Set the connection destination of the sandbox environment / production environment. 
     The default false setting connects to the sandbox environment. 
     The True setting connects to the production environment. */
  productionMode: false,
});

interface CreatePaymentRequest {
  merchantPaymentId: string;
  amount: {
    amount: number;
    currency: 'JPY';
  };
  orderDescription: string;
  redirectUrl: string;
  redirectType: string;
  userAgent: string;
  webhookUrl?: string;
}

interface PayPayQRPayload {
  merchantPaymentId: string;
  amount: {
    amount: number;
    currency: 'JPY';
  };
  codeType: 'ORDER_QR';
  orderDescription: string;
  isAuthorization: boolean;
}

interface PayPayAPIResponse {
  BODY: {
    resultInfo: {
      code: string;
      message: string;
      codeId: string;
    };
    data?: {
      paymentId: string;
      status: string;
      acceptedAt: number;
      merchantPaymentId: string;
      amount: {
        amount: number;
        currency: string;
      };
      orderDescription: string;
      redirectUrl: string;
      redirectType: string;
      deeplink: string;
      webPaymentUrl: string;
    };
  };
}

interface PayPayPaymentResponse {
  resultInfo: {
    code: string;
    message: string;
    codeId: string;
  };
  data?: {
    paymentId: string;
    status: string;
    acceptedAt: number;
    merchantPaymentId: string;
    amount: {
      amount: number;
      currency: string;
    };
    orderDescription: string;
    redirectUrl: string;
    redirectType: string;
    deeplink: string;
    webPaymentUrl: string;
  };
}

class PayPayService {
  async createPayment(paymentRequest: CreatePaymentRequest): Promise<PayPayPaymentResponse> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Creating PayPay payment with request:', paymentRequest);

        // Creating the payload to create a QR Code with webhook support
        const payload = {
          merchantPaymentId: paymentRequest.merchantPaymentId,
          amount: {
            amount: paymentRequest.amount.amount,
            currency: paymentRequest.amount.currency
          },
          codeType: "ORDER_QR",
          orderDescription: paymentRequest.orderDescription,
          isAuthorization: false,
          redirectUrl: paymentRequest.redirectUrl,
          redirectType: "APP_DEEP_LINK",
          userAgent: paymentRequest.userAgent,
          // Add webhook URL if provided
          ...(paymentRequest.webhookUrl && { webhookUrl: paymentRequest.webhookUrl })
        };

        console.log('🔗 Webhook URL being sent to PayPay:', paymentRequest.webhookUrl);
        console.log('📦 Full payload sent to PayPay:', JSON.stringify(payload, null, 2));

        // Calling the method to create a QR code
        PAYPAY.QRCodeCreate(payload, (response: PayPayAPIResponse) => {
          // Printing if the method call was SUCCESS
          console.log('🎯 PayPay QR Code Creation Response:');
          console.log('📋 Result Code:', response.BODY.resultInfo.code);
          console.log('📋 Result Message:', response.BODY.resultInfo.message);
          console.log('📋 Full Response:', response);
          console.log('📋 Payload Sent:', payload);

          // Check if the method call was SUCCESS
          if (response && response.BODY && response.BODY.resultInfo) {
            const resultInfo = response.BODY.resultInfo;

            if (resultInfo.code === 'SUCCESS') {
              resolve({
                resultInfo: resultInfo,
                data: response.BODY.data
              });
            } else {
              reject(new Error(`PayPay API Error: ${resultInfo.message} (Code: ${resultInfo.code})`));
            }
          } else {
            reject(new Error('Invalid PayPay API response format'));
          }
        });

      } catch (error: any) {
        console.error('PayPay API Error:', error);
        reject(new Error(`Failed to create PayPay payment: ${error.message}`));
      }
    });
  }

  async getPaymentDetails(merchantPaymentId: string): Promise<PayPayPaymentResponse> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔍 Getting PayPay payment details for merchantPaymentId:', merchantPaymentId);
        console.log('📋 Following PayPay\'s recommended 4-5 second polling interval');
        
        // 🎯 SMART APPROACH: Try both methods based on payment stage
        // First, try GetCodePaymentDetails (for QR codes before payment)
        PAYPAY.GetCodePaymentDetails(merchantPaymentId, (response: PayPayAPIResponse) => {
          console.log('📡 PayPay GetCodePaymentDetails API Response:');
          console.log('📊 Result Code:', response.BODY.resultInfo.code);
          console.log('📊 Result Message:', response.BODY.resultInfo.message);
          console.log('📊 Full Response Data:', response.BODY.data);

          if (response && response.BODY && response.BODY.resultInfo) {
            const resultInfo = response.BODY.resultInfo;
            
            if (resultInfo.code === 'SUCCESS') {
              console.log('✅ PayPay QR Code Status Check Successful');
              console.log('📱 QR Code Status:', response.BODY.data?.status);
              
              // If QR code is still active, payment hasn't been completed yet
              if (response.BODY.data?.status === 'CREATED' || response.BODY.data?.status === 'ACTIVE') {
                console.log('⏳ QR Code Active - Payment not completed yet');
                console.log('💡 This is normal for pending payments');
              }

              resolve({
                resultInfo: resultInfo,
                data: response.BODY.data
              });
            } else if (resultInfo.code === 'DYNAMIC_QR_PAYMENT_NOT_FOUND') {
              console.log('🔄 QR Code not found - trying GetPaymentDetails for completed payment...');
              
              // Fallback: Try GetPaymentDetails for completed payments
              PAYPAY.GetPaymentDetails(merchantPaymentId, (paymentResponse: PayPayAPIResponse) => {
                console.log('📡 PayPay GetPaymentDetails API Response:');
                console.log('📊 Result Code:', paymentResponse.BODY.resultInfo.code);
                console.log('📊 Result Message:', paymentResponse.BODY.resultInfo.message);
                console.log('📊 Full Response Data:', paymentResponse.BODY.data);

                if (paymentResponse && paymentResponse.BODY && paymentResponse.BODY.resultInfo) {
                  const paymentResultInfo = paymentResponse.BODY.resultInfo;
                  
                  if (paymentResultInfo.code === 'SUCCESS') {
                    console.log('✅ PayPay Payment Status Check Successful');
                    console.log('💳 Payment Status:', paymentResponse.BODY.data?.status);
                    
                    // Log important status changes as per PayPay documentation
                    if (paymentResponse.BODY.data?.status === 'COMPLETED') {
                      console.log('🎉 Payment Status: COMPLETED - Payment successful!');
                    } else if (paymentResponse.BODY.data?.status === 'AUTHORIZED') {
                      console.log('🔐 Payment Status: AUTHORIZED - Preauth payment authorized');
                    } else if (paymentResponse.BODY.data?.status === 'CREATED') {
                      console.log('⏳ Payment Status: CREATED - Payment initiated, waiting for completion');
                    } else if (paymentResponse.BODY.data?.status === 'FAILED') {
                      console.log('❌ Payment Status: FAILED - Payment failed');
                    } else if (paymentResponse.BODY.data?.status === 'CANCELED') {
                      console.log('🚫 Payment Status: CANCELED - Payment was canceled');
                    } else if (paymentResponse.BODY.data?.status === 'EXPIRED') {
                      console.log('⏰ Payment Status: EXPIRED - Payment expired');
                    }

                    resolve({
                      resultInfo: paymentResultInfo,
                      data: paymentResponse.BODY.data
                    });
                  } else {
                    console.log('⚠️ Both API methods failed - payment may not exist yet');
                    console.log('📝 This is normal for newly created QR codes');
                    reject(new Error(`PayPay API Error: ${paymentResultInfo.message} (Code: ${paymentResultInfo.code})`));
                  }
                } else {
                  console.log('❌ Invalid PayPay payment details response format');
                  reject(new Error('Invalid PayPay payment details response format'));
                }
              });
            } else {
              console.log('⚠️ PayPay API returned non-success result:', resultInfo);
              reject(new Error(`PayPay API Error: ${resultInfo.message} (Code: ${resultInfo.code})`));
            }
          } else {
            console.log('❌ Invalid PayPay response format');
            reject(new Error('Invalid PayPay response format'));
          }
        });

      } catch (error: any) {
        console.error('🚨 PayPay API Error:', error);
        reject(new Error(`Failed to get PayPay payment details: ${error.message}`));
      }
    });
  }

  async cancelPayment(merchantPaymentId: string): Promise<PayPayPaymentResponse> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Cancelling PayPay payment:', merchantPaymentId);

        PAYPAY.CancelPayment(merchantPaymentId, (response: any) => {
          console.log('PayPay cancel response:', response);

          if (response && response.BODY && response.BODY.resultInfo) {
            const resultInfo = response.BODY.resultInfo;
            console.log('PayPay cancel result code:', resultInfo.code);

            resolve({
              resultInfo: resultInfo,
              data: response.BODY.data
            });
          } else {
            reject(new Error('Invalid PayPay cancel response format'));
          }
        });

      } catch (error: any) {
        console.error('PayPay API Error:', error);
        reject(new Error(`Failed to cancel PayPay payment: ${error.message}`));
      }
    });
  }

  async refundPayment(merchantPaymentId: string, refundAmount?: number): Promise<PayPayPaymentResponse> {
    return new Promise((resolve, reject) => {
      try {
        const refundRequest = {
          merchantRefundId: `refund_${Date.now()}`,
          paymentId: merchantPaymentId,
          amount: refundAmount ? { amount: refundAmount, currency: 'JPY' } : undefined,
          reason: 'Customer requested refund'
        };

        console.log('Processing PayPay refund:', refundRequest);

        PAYPAY.PaymentRefund(refundRequest, (response: any) => {
          console.log('PayPay refund response:', response);

          if (response && response.BODY && response.BODY.resultInfo) {
            const resultInfo = response.BODY.resultInfo;
            console.log('PayPay refund result code:', resultInfo.code);

            resolve({
              resultInfo: resultInfo,
              data: response.BODY.data
            });
          } else {
            reject(new Error('Invalid PayPay refund response format'));
          }
        });

      } catch (error: any) {
        console.error('PayPay Refund Error:', error);
        reject(new Error(`Failed to refund PayPay payment: ${error.message}`));
      }
    });
  }

  // Webhook configuration helper
  getWebhookConfiguration() {
    return {
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/paypay-webhook`,
      webhookEvents: [
        'PAYMENT_STATUS',
        'PAYMENT_COMPLETED', 
        'TRANSACTION'
      ],
      webhookFormat: {
        notification_type: 'Transaction',
        merchant_order_id: '{{order_id}}',
        state: '{{payment_status}}',
        order_amount: '{{amount}}',
        paid_at: '{{timestamp}}'
      },
      instructions: [
        '1. Go to PayPay Workbench: https://stg-www.paypay.ne.jp/',
        '2. Navigate to Settings → Webhooks',
        '3. Add webhook URL: ' + `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/paypay-webhook`,
        '4. Select events: Payment Status, Payment Completed, Transaction',
        '5. Save configuration'
      ]
    };
  }
}

export const payPayService = new PayPayService();
export type { CreatePaymentRequest, PayPayPaymentResponse, PayPayQRPayload, PayPayAPIResponse };
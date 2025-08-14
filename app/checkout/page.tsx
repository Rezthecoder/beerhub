'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import StripeCheckout from '../../components/StripeCheckout'
import Toast from '../../components/Toast'
import PayPayLogo from '../../components/PayPayLogo'
import { useToast } from '../../hooks/useToast'

interface CheckoutPageProps {
  searchParams: {
    productId?: string
    quantity?: string
  }
}

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const router = useRouter()
  const [selectedPayment, setSelectedPayment] = useState<string>('credit')
  const [isProcessing, setIsProcessing] = useState(false)
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const { toast, showSuccess, showError, hideToast } = useToast()

  const [payPayQRCode, setPayPayQRCode] = useState<string | null>(null)
  const [payPayPaymentId, setPayPayPaymentId] = useState<string | null>(null)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [currentPollInterval, setCurrentPollInterval] = useState<NodeJS.Timeout | null>(null)

  // Get product details from search params
  const productId = searchParams.productId ? parseInt(searchParams.productId) : null
  const quantity = searchParams.quantity ? parseInt(searchParams.quantity) : 1

  const [product, setProduct] = useState<any>(null)
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    if (productId) {
      fetchProductDetails(productId)
    }
  }, [productId])

  const fetchProductDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/products/${id}`)
      if (response.ok) {
        const productData = await response.json()
        setProduct(productData.product)
        setTotalAmount(productData.product.price * quantity)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    }
  }

  const handlePayPayPayment = async () => {
    try {
      setIsProcessing(true)
      showSuccess('Creating PayPay QR Code...')

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          customerEmail: customerEmail || 'paypay@example.com',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'PayPay payment failed')
      }

      if (result.webPaymentUrl || result.qrCodeUrl) {
        setPayPayQRCode(result.webPaymentUrl || result.qrCodeUrl)
        setPayPayPaymentId(result.paymentId)
        setCurrentOrderId(result.orderId)
        showSuccess('PayPay QR Code generated! Scan with your PayPay app.')

        startPaymentStatusPolling(result.orderId, result.merchantPaymentId)
      } else {
        console.error('PayPay API Response:', result)
        throw new Error(`PayPay QR code not available. ${result.message || 'Please check PayPay configuration.'}`)
      }

    } catch (error: any) {
      console.error('PayPay payment error:', error)
      showError(`PayPay Error: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const startPaymentStatusPolling = (orderId: string, merchantPaymentId: string) => {
    if (currentPollInterval) {
      clearInterval(currentPollInterval)
      console.log('🛑 Stopped previous polling instance')
    }

    console.log('🚀 Starting payment status polling for:', { orderId, merchantPaymentId })

    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 Polling payment status for Order', orderId)
        const response = await fetch(`/api/check-payment-status?orderId=${orderId}`)
        const result = await response.json()

        console.log('📋 Payment status check result for Order', orderId, ':', result)

        if (result.status === 'completed') {
          clearInterval(pollInterval)
          console.log('🎉 Payment completed! Stopping polling and redirecting...')
          showSuccess('Payment completed! Redirecting...')
          setTimeout(() => {
            router.push(`/payment/success?orderId=${orderId}&method=paypay`)
          }, 1500)
        } else if (result.status === 'failed') {
          clearInterval(pollInterval)
          console.log('❌ Payment failed! Stopping polling...')
          showError('Payment failed. Please try again.')
          setPayPayQRCode(null)
          setPayPayPaymentId(null)
        }
      } catch (error: any) {
        console.error('Polling error:', error)
      }
    }, 4500)

    setCurrentPollInterval(pollInterval)
  }

  if (!product) {
    return (
      <div className="container py-3 py-md-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading product details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-3 py-md-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow border-0">
            <div className="card-header bg-primary text-white text-center py-3">
              <h4 className="mb-0 fs-5 fs-md-4">🍺 Secure Checkout</h4>
            </div>
            <div className="card-body p-3 p-md-4">
              {/* Order Summary */}
              <div
                className="order-summary mb-4 p-3 rounded"
                style={{
                  backgroundColor: '#fffbe6',
                  border: '1px solid #ffe066'
                }}
              >
                <h5 className="mb-3 fs-6 fs-md-5" style={{ color: '#b8860b' }}>Order Summary</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-break" style={{ color: '#333' }}>{product.name}</span>
                  <span className="ms-2 text-nowrap" style={{ color: '#b8860b' }}>¥{product.price.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#555' }}>Quantity</span>
                  <span style={{ color: '#555' }}>{quantity}</span>
                </div>
                <hr className="my-2" style={{ borderColor: '#ffe066' }} />
                <div className="d-flex justify-content-between fw-bold fs-6 fs-md-5">
                  <span style={{ color: '#b8860b' }}>Total</span>
                  <span className="text-warning" style={{ color: '#ff9800' }}>¥{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="payment-methods mb-4">
                <h5 className="mb-3 fs-6 fs-md-5">Choose Payment Method</h5>
                <div className="row g-2">
                  <div className="col-12 col-md-4 mb-2">
                    <input
                      type="radio"
                      className="btn-check"
                      name="payment"
                      id="credit"
                      checked={selectedPayment === 'credit'}
                      onChange={() => setSelectedPayment('credit')}
                    />
                    <label className="btn btn-outline-primary w-100 py-3" htmlFor="credit">
                      <span className="d-block">💳</span>
                      <span className="small">Credit Card</span>
                    </label>
                  </div>
                  <div className="col-12 col-md-4 mb-2">
                    <input
                      type="radio"
                      className="btn-check"
                      name="payment"
                      id="paypay"
                      checked={selectedPayment === 'paypay'}
                      onChange={() => setSelectedPayment('paypay')}
                    />
                    <label
                      className="btn w-100 p-0 d-flex align-items-stretch justify-content-center"
                      htmlFor="paypay"
                      style={{
                        height: '100%',
                        border: selectedPayment === 'paypay' ? '2px solid #dc3545' : '1px solid #dc3545',
                        boxShadow: selectedPayment === 'paypay' ? '0 0 0 0.2rem rgba(220,53,69,.25)' : undefined,
                        minHeight: 70,
                        padding: 0,
                        background: 'none'
                      }}
                    >
                      <img
                        src="/images/paypay.png"
                        alt="PayPay"
                        style={{
                          width: '100%',
                          height: '70px',
                          objectFit: 'cover',
                          display: 'block',
                          borderRadius: '0.375rem'
                        }}
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4 mb-2">
                    <input
                      type="radio"
                      className="btn-check"
                      name="payment"
                      id="cod"
                      checked={selectedPayment === 'cod'}
                      onChange={() => setSelectedPayment('cod')}
                    />
                    <label className="btn btn-outline-success w-100 py-3" htmlFor="cod">
                      <span className="d-block">💰</span>
                      <span className="small">Cash on Delivery</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Customer Email Input */}
              <div className="mb-4">
                <label htmlFor="customerEmail" className="form-label fw-bold">
                  📧 Email Address <span className="text-danger">*</span> <small className="text-muted">(Required for Cash on Delivery)</small>
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="customerEmail"
                  placeholder="Enter your email address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required={selectedPayment === 'cod'}
                />
                <small className="text-muted">
                  {selectedPayment === 'cod'
                    ? 'We\'ll send order confirmation to this email'
                    : 'Optional for PayPay and Credit Card payments'
                  }
                </small>
              </div>

              {/* Credit Card Form with Stripe */}
              {selectedPayment === 'credit' && (
                <div className="payment-form">
                  <h6 className="mb-3 fs-6">💳 Credit Card Information</h6>
                  <StripeCheckout
                    productId={product.id}
                    quantity={quantity}
                    totalAmount={totalAmount}
                    onSuccess={(orderId) => {
                      showSuccess('Payment successful! Redirecting...')
                      setTimeout(() => {
                        router.push(`/payment/success?orderId=${orderId}&method=credit_card`)
                      }, 1500)
                    }}
                    onError={(error) => {
                      showError(error)
                    }}
                  />
                </div>
              )}

              {/* PayPay Payment */}
              {selectedPayment === 'paypay' && (
                <div className="text-center">
                  {!payPayQRCode ? (
                    <>
                      <button
                        onClick={handlePayPayPayment}
                        className="btn btn-danger btn-lg w-100 fw-bold d-flex align-items-center justify-content-center py-3"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            <span className="d-none d-sm-inline">Creating QR Code...</span>
                            <span className="d-sm-none">Creating...</span>
                          </>
                        ) : (
                          <>
                            <img
                              src="/images/paypay.png"
                              alt="PayPay"
                              width={80}
                              height={40}
                              className="me-2 d-none d-sm-inline rounded"
                              style={{ objectFit: 'contain' }}
                            />
                            <span className="d-none d-sm-inline">Generate QR Code - ¥{totalAmount.toLocaleString()}</span>
                            <span className="d-sm-none text-white">Generate QR - ¥{totalAmount.toLocaleString()}</span>
                          </>
                        )}
                      </button>
                      <small className="text-muted d-block mt-2">
                        Click to generate PayPay QR code for payment
                      </small>
                    </>
                  ) : (
                    <div className="paypay-qr-section">
                      <div className="alert alert-info">
                        <h6 className="mb-3 fs-6">📱 Scan QR Code with PayPay App</h6>
                        <div className="text-center mb-3">
                          <div className="qr-code-container p-2 p-md-3 bg-white rounded border d-inline-block">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payPayQRCode)}`}
                              alt="PayPay QR Code"
                              className="img-fluid"
                              style={{
                                maxWidth: 'min(200px, 80vw)',
                                maxHeight: 'min(200px, 80vw)',
                                width: 'auto',
                                height: 'auto'
                              }}
                            />
                          </div>
                          <div className="mt-2">
                            <small className="text-muted">
                              Scan this QR code with your PayPay app to complete payment
                            </small>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="mb-2">
                            <strong>Order ID:</strong> {currentOrderId || 'Loading...'}
                          </p>
                        </div>
                        <small className="text-muted d-block">
                          Waiting for payment confirmation... This page will automatically update when payment is completed.
                        </small>
                        <div className="mt-3">
                          {/* Current Order Status */}
                          <div className="alert alert-secondary small">
                            <strong>📋 Current Order Status:</strong><br />
                            <strong>Order ID:</strong> {currentOrderId || 'Creating...'}<br />
                            <strong>Status:</strong> <span className="badge bg-warning">Pending</span>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex flex-column flex-sm-row gap-2 mt-2">
                        <button
                          onClick={() => {
                            setPayPayQRCode(null)
                            setPayPayPaymentId(null)
                          }}
                          className="btn btn-outline-secondary flex-fill py-2"
                        >
                          <span className="d-none d-sm-inline">Cancel & Generate New QR Code</span>
                          <span className="d-sm-none">Cancel</span>
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              showSuccess('Checking payment status...')
                              console.log('🔍 Checking payment status for:', { currentOrderId, payPayPaymentId })

                              const response = await fetch(`/api/check-payment-status?orderId=${currentOrderId}`)
                              const data = await response.json()

                              console.log('📋 Payment status response:', data)

                              if (data.status === 'completed') {
                                showSuccess('Payment completed! Redirecting...')
                                setTimeout(() => {
                                  router.push(`/payment/success?orderId=${currentOrderId}&method=paypay`)
                                }, 1500)
                              } else if (data.status === 'failed') {
                                showError('Payment failed. Please try again.')
                                setPayPayQRCode(null)
                                setPayPayPaymentId(null)
                              } else {
                                showError(`Payment not completed yet. Status: ${data.status}. Message: ${data.message}`)
                              }
                            } catch (error: any) {
                              console.error('Error checking payment status:', error)
                              showError('Failed to check payment status')
                            }
                          }}
                          className="btn btn-info btn-sm me-2"
                          disabled={!currentOrderId}
                        >
                          🔍 Check Payment Status
                        </button>

                        {/* Manual Success Button for Testing */}
                        <button
                          onClick={async () => {
                            try {
                              if (!currentOrderId) {
                                showError('No order ID available')
                                return
                              }

                              showSuccess('Manually completing payment...')

                              const response = await fetch('/api/check-payment-status', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  orderId: currentOrderId,
                                  action: 'force_complete'
                                }),
                              })

                              const data = await response.json()

                              if (response.ok && data.status === 'completed') {
                                showSuccess('Payment manually completed! Redirecting...')
                                setTimeout(() => {
                                  router.push(`/payment/success?orderId=${currentOrderId}&method=paypay`)
                                }, 1500)
                              } else {
                                showError('Failed to manually complete payment')
                              }
                            } catch (error: any) {
                              console.error('Error manually completing payment:', error)
                              showError('Failed to manually complete payment')
                            }
                          }}
                          className="btn btn-success btn-sm me-2"
                          disabled={!currentOrderId}
                          title="Force complete payment for testing"
                        >
                          ✅ Force Complete
                        </button>
                        <button
                          onClick={() => {
                            showSuccess('Simulating payment completion...')
                            setTimeout(() => {
                              router.push(`/payment/success?orderId=demo&method=paypay`)
                            }, 1500)
                          }}
                          className="btn btn-success flex-fill py-2"
                        >
                          <span className="d-none d-sm-inline">🧪 Test Complete Payment</span>
                          <span className="d-sm-none">🧪 Test</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cash on Delivery */}
              {selectedPayment === 'cod' && (
                <div className="text-center">
                  <div className="alert alert-info mb-4">
                    <h6 className="fs-6 mb-3">💰 Cash on Delivery</h6>
                    <p className="mb-2">Pay ¥{totalAmount.toLocaleString()} when your order is delivered.</p>
                    <small className="text-muted">Delivery fee: ¥300 (Free for orders over ¥2,000)</small>
                  </div>

                  {/* Delivery Information */}
                  <div className="delivery-info mb-4 p-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                    <h6 className="mb-3" style={{ color: '#495057' }}>📦 Delivery Details</h6>
                    <div className="row text-start">
                      <div className="col-md-6 mb-2">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-clock me-2" style={{ color: '#28a745' }}></i>
                          <span style={{ fontSize: '14px' }}>Delivery Time: 2-3 business days</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-map-marker-alt me-2" style={{ color: '#dc3545' }}></i>
                          <span style={{ fontSize: '14px' }}>Delivery Area: Tokyo, Osaka, Kyoto</span>
                        </div>
                      </div>
                      <div className="col-md-6 mb-2">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-credit-card me-2" style={{ color: '#ffc107' }}></i>
                          <span style={{ fontSize: '14px' }}>Payment: Cash only</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-shield-alt me-2" style={{ color: '#17a2b8' }}></i>
                          <span style={{ fontSize: '14px' }}>Order Protection: 100% Secure</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div className="important-notes mb-4 p-3 rounded" style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb' }}>
                    <h6 className="mb-3" style={{ color: '#721c24' }}>⚠️ Important Information</h6>
                    <ul className="text-start mb-0" style={{ fontSize: '14px', color: '#721c24' }}>
                      <li>Please have exact change ready for delivery</li>
                      <li>Orders are processed within 24 hours</li>
                      <li>Delivery attempts: 2 times maximum</li>
                      <li>Contact us if you need to reschedule</li>
                      <li>Returns accepted within 7 days</li>
                    </ul>
                  </div>

                  <button
                    className="cod-button"
                    style={{
                      backgroundColor: '#dc3545',
                      color: '#ffffff',
                      borderColor: '#dc3545',
                      border: '2px solid #dc3545',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                    onClick={async () => {
                      try {
                        if (!customerEmail) {
                          showError('Please enter your email address')
                          return
                        }

                        showSuccess('Creating Cash on Delivery order...')

                        // Create order in database
                        const response = await fetch('/api/create-payment', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            productId: product.id,
                            quantity: quantity,
                            customerEmail: customerEmail,
                            paymentMethod: 'cod'
                          }),
                        })

                        const data = await response.json()

                        if (response.ok && data.orderId) {
                          showSuccess('Cash on Delivery order created! Redirecting...')
                          setTimeout(() => {
                            router.push(`/payment/success?orderId=${data.orderId}&method=cod`)
                          }, 1500)
                        } else {
                          showError(data.error || 'Failed to create order')
                        }
                      } catch (error: any) {
                        console.error('Error creating COD order:', error)
                        showError('Failed to create order. Please try again.')
                      }
                    }}
                  >
                    📦 Place COD Order
                  </button>
                </div>
              )}

              <div className="text-center mt-3">
                <small className="text-muted">
                  🔒 Your payment information is secure and encrypted
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification - Positioned at bottom */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={hideToast}
      />
    </div>
  )
}

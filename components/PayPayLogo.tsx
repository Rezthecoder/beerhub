import React from 'react';
import Image from 'next/image';

interface PayPayLogoProps {
    width?: number;
    height?: number;
    className?: string;
}

const PayPayLogo: React.FC<PayPayLogoProps> = ({
    width = 120,
    height = 40,
    className = ''
}) => {
    return (
        <Image
            src="/images/paypay.jpg"
            alt="PayPay"
            width={width}
            height={height}
            className={className}
            style={{
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
                maxWidth: '100%'
            }}
        />
    );
};

export default PayPayLogo;
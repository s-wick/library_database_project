import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';


export default function PaymentPage() {
  const { setTheme, theme } = useTheme();
  const location = useLocation();
    
  // Force light mode for the payment page
  useEffect(() => {
    const previous = theme
    setTheme("light")
    return () => setTheme(previous)
  }, [])

    // Get amount and type from previous page
    const amount = location.state?.amount || 0;
    const paymentType = location.state?.type || 'purchase';

    // Calculate tax only for book purchases
    const taxRate = paymentType === 'fine' ? 0 : 0.0825;
    const tax = amount * taxRate;
    const total = amount + tax;

  // Main content   
  return (
    <div className="min-h-screen bg-background">

     {/* Header with only back button to user dashboard */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
            <div className="flex items-center gap-3">
                <Link to="/user-dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="hidden sm:inline">Back</span>
                </Link>
            </div>
        </header>


        {/* Card information content */}
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        
            <div>
                {/*left side*/}

                {/* Personal information section */}
                <h2 className="text-2xl font-semibold mb-6">Personal Information</h2>

                <div className="space-y-4">

                    <div className="flex gap-4">
                    <input
                    type="text"
                    placeholder="First Name*"
                    className="w-1/2 border rounded-1g p-3 text-sm bg-background"/>

                    <input
                    type="text"
                    placeholder="Last Name*"
                    className="w-1/2 border rounded-1g p-3 text-sm bg-background"/>
                    </div>

                    <input
                    type="text"
                    placeholder="ID Number*"
                    className="w-full border rounded-1g p-3 text-sm bg-background"/>

                    <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full border rounded-1g p-3 text-sm bg-background"/>

                    <input
                    type="text"
                    placeholder="Phone Number"
                    className="w-full border rounded-1g p-3 text-sm bg-background"/>
                </div>
                
                {/* Card information section */}
                <h2 className="text-2xl font-semibold mb-6 mt-6">Card Information</h2>

                <div className="space-y-4">
                    <input
                    type="text"
                    placeholder="Card Number*"
                    className="w-full border rounded-1g p-3 text-sm bg-background"/>

                    <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Expiry Date (MM/YY)*"
                        className="w-1/2 border rounded-1g p-3 text-sm bg-background"/>

                    <input
                        type="text"
                        placeholder="CVV*"
                        className="w-1/2 border rounded-1g p-3 text-sm bg-background"/>
                    </div>

                    <input
                    type="text"
                    placeholder="Cardholder Name*"
                    className="w-full border rounded-1g p-3 text-sm bg-background"/>

                    <button className="w-full bg-chart-3 text-white py-3 rounded-full mt-4 hover:bg-chart-3/80 transition">
                    Pay ${total.toFixed(2)}
                    </button>
                </div>
            </div> 

        {/* Right side with order summary */}
        <div className="border rounded-xl p-6 h-fit">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            
            <div className="flex justify-between text-sm mb-2">
                <span>Subtotal</span>
                <span>${amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm mb-2">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
            </div>

            <div className="border-t my-3"></div>

            <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>
        </div>

    </div>
    );
}
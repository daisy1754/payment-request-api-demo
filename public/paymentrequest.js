
const creditCardPaymentMethod = {
  supportedMethods: 'basic-card',
  data: {
    // https://www.w3.org/Payments/card-network-ids
    supportedNetworks: ['visa', 'mastercard', 'amex']
  },
};
const googlePayData = {
  apiVersion: 1,
  environment: 'TEST',
  merchantId: '01234567890123456789',
  allowedPaymentMethods: ['CARD', 'TOKENIZED_CARD'],
    paymentMethodTokenizationParameters: {
      tokenizationType: 'DIRECT',
      parameters: {
        publicKey: 'thisispubkey'
      }
    },
  cardRequirements: {
    allowedCardNetworks: ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA']
  }
};
const googlePayMethod = {supportedMethods: 'https://google.com/pay', data: googlePayData};

const supportedPaymentMethods = [creditCardPaymentMethod, googlePayMethod];

const subtotal = {
  label: 'Subtotal',
  amount: {
    currency: 'USD',
    value: 12,
  },
};
const discount = {
  label: 'Discount (10%)',
  amount: {
    currency: 'USD',
    value: -1.2,
  },
};
const tax = {
  label: 'Tax',
  pending: true,
  amount: {
    currency: 'USD',
    value: 0.68,
  },
};
const pendingShipping = {
  label: 'Shipping',
  pending: true,
  amount: {
    currency: 'USD',
    value: 0,
  },
};
const allDisplayItems = [subtotal, discount, tax, pendingShipping];
const tempTotal = 11.48;

const paymentDetails = {
  total: {
    label: 'Total',
    amount: {
      currency: 'USD',
      value: tempTotal,
    },
  },
  displayItems: allDisplayItems,
};

const options = {
  requestPayerEmail: true,
  requestShipping: true,
};

const paymentRequest = new PaymentRequest(supportedPaymentMethods, paymentDetails, options);

const canMakePaymentPromise = () => {
  // Feature detect canMakePayment()
  if (paymentRequest.canMakePayment) {
    return paymentRequest.canMakePayment();
  }
  // If canMakePayment() isn't available, default to assume the method is not supported.
  return Promise.resolve(false);
}

const getShippingOptions = () => {
  return [
       {
         id: 'economy',
         label: 'Economy Shipping (5-7 Days)',
         amount: {
           currency: 'USD',
           value: '0',
         },
       }, {
         id: 'express',
         label: 'Express Shipping (2-3 Days)',
         amount: {
           currency: 'USD',
           value: '5',
         },
       }, {
         id: 'next-day',
         label: 'Next Day Delivery',
         amount: {
           currency: 'USD',
           value: '12',
         },
       },
     ]  
}

const requestPayment = () => {
  paymentRequest.addEventListener('shippingaddresschange', (event) => {
    // User changed the shipping address (this includes the first time user select the address)
    console.log(paymentRequest.shippingAddress);
    updateShippingOptionPromise = new Promise((resolve) => { 
      // Simulate delay for fetching shipping info from remote server.
       setTimeout(() => {
         paymentDetails.shippingOptions = getShippingOptions();
         resolve(paymentDetails);
       }, 2000);
    });
    event.updateWith(updateShippingOptionPromise);
  });

  paymentRequest.addEventListener('shippingoptionchange', (event) => {
    const selectedId = event.target.shippingOption;

    let selectedShipping;
    paymentDetails.shippingOptions.forEach((option) => {
      if (option.id === selectedId) {
        selectedShipping = option;
      }
      option.selected = option.id === selectedId;
    });

    paymentDetails.total = {
      label: 'Total',
      amount: {
        currency: 'USD',
        value: tempTotal + selectedShipping.amount.value,
      },
    };
    
    paymentDetails.displayItems = [subtotal, discount, tax, selectedShipping];

    event.updateWith(paymentDetails);
  });

  paymentRequest.show()
  .then((paymentResponse) => {
    // The user filled in the required fields and completed the flow
    // Get the details from `paymentResponse` and complete the transaction.
    console.log(paymentResponse);
    
    document.getElementById("checkout").style.display = 'none';
    document.getElementById("result").style.display = 'block';
    document.getElementById("result").innerText = `Payment info requested\n${JSON.stringify(paymentResponse)}`
      
    return paymentResponse.complete();
  })
  .catch((err) => {
    // The API threw an error or the user closed the UI
    console.log(err);
  });
};

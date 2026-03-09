import { Language } from '@/contexts/CartContext';

type TranslationKey = string;

const translations: Record<TranslationKey, Record<Language, string>> = {
  // Header
  'home': { en: 'Home', mr: 'मुख्य', hi: 'होम' },
  'menu': { en: 'Menu', mr: 'मेनू', hi: 'मेनू' },
  'about': { en: 'About', mr: 'बद्दल', hi: 'हमारे बारे में' },
  'contact': { en: 'Contact', mr: 'संपर्क', hi: 'संपर्क' },
  'callNow': { en: 'Call Now', mr: 'कॉल करा', hi: 'कॉल करें' },

  // Hero
  'heroTitle': { en: 'Pure Vegetarian Parcel Service', mr: 'शुद्ध शाकाहारी पार्सल सेवा', hi: 'शुद्ध शाकाहारी पार्सल सेवा' },
  'heroSubtitle': { en: 'Taste of Tradition, Delivered Fresh', mr: 'परंपरेचा स्वाद, ताज्या पोहोचविला', hi: 'परंपरा का स्वाद, ताज़ा डिलीवर' },
  'orderNow': { en: 'Order Now', mr: 'ऑर्डर करा', hi: 'ऑर्डर करें' },
  'whatsappOrder': { en: 'WhatsApp Order', mr: 'व्हाट्सअॅप ऑर्डर', hi: 'व्हाट्सएप ऑर्डर' },

  // Menu
  'ourMenu': { en: 'Our Menu', mr: 'आमचा मेनू', hi: 'हमारा मेनू' },
  'menuSubtitle': { en: 'Authentic vegetarian delicacies made with love', mr: 'प्रेमाने बनवलेले प्रामाणिक शाकाहारी पदार्थ', hi: 'प्यार से बनी प्रामाणिक शाकाहारी स्वादिष्ट व्यंजन' },
  'searchPlaceholder': { en: 'Search menu items...', mr: 'मेनू शोधा...', hi: 'मेनू खोजें...' },
  'noResults': { en: 'No items found', mr: 'कोणतेही आयटम सापडले नाहीत', hi: 'कोई आइटम नहीं मिला' },
  'added': { en: 'Added!', mr: 'जोडले!', hi: 'जोड़ा!' },

  // Categories
  'All': { en: 'All', mr: 'सर्व', hi: 'सभी' },
  'Curry': { en: 'Curry', mr: 'करी', hi: 'करी' },
  'Dal': { en: 'Dal', mr: 'डाळ', hi: 'दाल' },
  'Paneer': { en: 'Paneer', mr: 'पनीर', hi: 'पनीर' },
  'Special': { en: 'Special', mr: 'विशेष', hi: 'विशेष' },
  'Bread': { en: 'Bread', mr: 'ब्रेड', hi: 'ब्रेड' },

  // Combos
  'mealCombos': { en: 'Meal Combos', mr: 'मील कॉम्बो', hi: 'मील कॉम्बो' },
  'comboSubtitle': { en: 'Save more with our special combo offers!', mr: 'आमच्या विशेष कॉम्बो ऑफर्सवर जास्त बचत करा!', hi: 'हमारे विशेष कॉम्बो ऑफर से ज़्यादा बचत करें!' },
  'addCombo': { en: 'Add Combo', mr: 'कॉम्बो जोडा', hi: 'कॉम्बो जोड़ें' },

  // Cart
  'yourOrder': { en: 'Your Order', mr: 'तुमची ऑर्डर', hi: 'आपका ऑर्डर' },
  'cartEmpty': { en: 'Your cart is empty', mr: 'तुमची कार्ट रिकामी आहे', hi: 'आपकी कार्ट खाली है' },
  'total': { en: 'Total', mr: 'एकूण', hi: 'कुल' },
  'proceedToCheckout': { en: 'Proceed to Checkout', mr: 'चेकआउट करा', hi: 'चेकआउट करें' },
  'continueShopping': { en: 'Continue Shopping', mr: 'खरेदी सुरू ठेवा', hi: 'खरीदारी जारी रखें' },
  'viewCart': { en: 'View Cart', mr: 'कार्ट पहा', hi: 'कार्ट देखें' },

  // Checkout
  'checkout': { en: 'Checkout', mr: 'चेकआउट', hi: 'चेकआउट' },
  'backToMenu': { en: 'Back to Menu', mr: 'मेनूवर परत जा', hi: 'मेनू पर वापस जाएं' },
  'customerInfo': { en: 'Customer Information', mr: 'ग्राहक माहिती', hi: 'ग्राहक जानकारी' },
  'fullName': { en: 'Full Name', mr: 'पूर्ण नाव', hi: 'पूरा नाम' },
  'enterName': { en: 'Enter your full name', mr: 'तुमचे पूर्ण नाव टाका', hi: 'अपना पूरा नाम दर्ज करें' },
  'mobileNumber': { en: 'Mobile Number', mr: 'मोबाईल नंबर', hi: 'मोबाइल नंबर' },
  'mobilePlaceholder': { en: '10-digit mobile number', mr: '१० अंकी मोबाईल नंबर', hi: '10 अंकों का मोबाइल नंबर' },
  'deliveryMethod': { en: 'Delivery Method', mr: 'डिलिव्हरी पद्धत', hi: 'डिलीवरी तरीका' },
  'pickup': { en: 'Pickup', mr: 'पिकअप', hi: 'पिकअप' },
  'homeDelivery': { en: 'Home Delivery', mr: 'होम डिलिव्हरी', hi: 'होम डिलीवरी' },
  'deliveryAddress': { en: 'Delivery Address', mr: 'डिलिव्हरी पत्ता', hi: 'डिलीवरी पता' },
  'enterAddress': { en: 'Enter your complete address', mr: 'तुमचा संपूर्ण पत्ता टाका', hi: 'अपना पूरा पता दर्ज करें' },
  'shareLocation': { en: 'Share Your Location', mr: 'तुमचे स्थान शेअर करा', hi: 'अपना स्थान साझा करें' },
  'capturingLocation': { en: 'Capturing Location...', mr: 'स्थान कॅप्चर करत आहे...', hi: 'स्थान कैप्चर हो रहा है...' },
  'locationCaptured': { en: 'Location Captured', mr: 'स्थान कॅप्चर केले', hi: 'स्थान कैप्चर हुआ' },
  'viewOnMaps': { en: 'View on Maps', mr: 'मॅपवर पहा', hi: 'मैप पर देखें' },
  'clear': { en: 'Clear', mr: 'साफ करा', hi: 'साफ करें' },
  'locationOptional': { en: 'Optional: Share your precise location for faster delivery', mr: 'पर्यायी: जलद डिलिव्हरीसाठी तुमचे अचूक स्थान शेअर करा', hi: 'वैकल्पिक: तेज़ डिलीवरी के लिए अपना सटीक स्थान साझा करें' },
  'paymentMethod': { en: 'Payment Method', mr: 'पेमेंट पद्धत', hi: 'भुगतान का तरीका' },
  'cashOnDelivery': { en: 'Cash on Delivery/Pickup', mr: 'रोख पेमेंट', hi: 'कैश ऑन डिलीवरी/पिकअप' },
  'onlinePayment': { en: 'Online Payment (UPI/Card/Wallet)', mr: 'ऑनलाईन पेमेंट (UPI/Card/Wallet)', hi: 'ऑनलाइन पेमेंट (UPI/Card/Wallet)' },
  'completePayment': { en: 'Complete Your Payment', mr: 'तुमचे पेमेंट पूर्ण करा', hi: 'अपना भुगतान पूरा करें' },
  'placeOrder': { en: 'Place Order', mr: 'ऑर्डर द्या', hi: 'ऑर्डर दें' },
  'placingOrder': { en: 'Placing Order...', mr: 'ऑर्डर देत आहे...', hi: 'ऑर्डर दे रहे हैं...' },
  'orderSummary': { en: 'Order Summary', mr: 'ऑर्डर सारांश', hi: 'ऑर्डर सारांश' },

  // Delivery time
  'estimatedTime': { en: 'Estimated Time', mr: 'अंदाजित वेळ', hi: 'अनुमानित समय' },
  'prepTime': { en: '20-30 min (Preparation)', mr: '२०-३० मिनिटे (तयारी)', hi: '20-30 मिनट (तैयारी)' },
  'deliveryTime': { en: '30-45 min (Prep + Delivery)', mr: '३०-४५ मिनिटे (तयारी + डिलिव्हरी)', hi: '30-45 मिनट (तैयारी + डिलीवरी)' },

  // Order Success
  'orderSuccess': { en: 'Order Placed Successfully!', mr: 'ऑर्डर यशस्वीरित्या दिली!', hi: 'ऑर्डर सफलतापूर्वक दिया गया!' },
  'thankYou': { en: 'Thank you for your order. Your food will be ready soon!', mr: 'तुमच्या ऑर्डरसाठी धन्यवाद. तुमचे जेवण लवकरच तयार होईल!', hi: 'आपके ऑर्डर के लिए धन्यवाद। आपका खाना जल्द ही तैयार होगा!' },
  'orderReceipt': { en: 'Order Receipt', mr: 'ऑर्डर पावती', hi: 'ऑर्डर रसीद' },
  'orderNumber': { en: 'Order Number', mr: 'ऑर्डर नंबर', hi: 'ऑर्डर नंबर' },
  'customerName': { en: 'Customer Name', mr: 'ग्राहकाचे नाव', hi: 'ग्राहक का नाम' },
  'phoneNumber': { en: 'Phone Number', mr: 'फोन नंबर', hi: 'फ़ोन नंबर' },
  'orderItems': { en: 'Order Items', mr: 'ऑर्डर आयटम', hi: 'ऑर्डर आइटम' },
  'qty': { en: 'Qty', mr: 'प्रमाण', hi: 'मात्रा' },
  'downloadReceipt': { en: 'Download Receipt', mr: 'पावती डाउनलोड करा', hi: 'रसीद डाउनलोड करें' },
  'placeAnotherOrder': { en: 'Place Another Order', mr: 'आणखी ऑर्डर द्या', hi: 'और ऑर्डर दें' },
  'callHotel': { en: 'Call Hotel', mr: 'हॉटेलला कॉल करा', hi: 'होटल को कॉल करें' },
  'cash': { en: 'Cash', mr: 'रोख', hi: 'नकद' },
  'online': { en: 'Online', mr: 'ऑनलाईन', hi: 'ऑनलाइन' },
  'pointsEarned': { en: 'Points Earned', mr: 'मिळालेले पॉइंट्स', hi: 'अर्जित पॉइंट्स' },

  // Loyalty
  'loyaltyPoints': { en: 'Loyalty Points', mr: 'लॉयल्टी पॉइंट्स', hi: 'लॉयल्टी पॉइंट्स' },
  'earnPoints': { en: 'Earn 1 point per ₹10 spent', mr: 'प्रत्येक ₹10 खर्चावर 1 पॉइंट मिळवा', hi: 'हर ₹10 खर्च पर 1 पॉइंट कमाएं' },

  // Gallery
  'photoGallery': { en: 'Our Dishes', mr: 'आमचे पदार्थ', hi: 'हमारे व्यंजन' },
  'gallerySubtitle': { en: 'A glimpse of our delicious preparations', mr: 'आमच्या स्वादिष्ट पदार्थांची झलक', hi: 'हमारी स्वादिष्ट तैयारियों की एक झलक' },

  // Footer
  'pureVegService': { en: 'Pure Vegetarian Parcel Service', mr: 'शुद्ध शाकाहारी पार्सल सेवा', hi: 'शुद्ध शाकाहारी पार्सल सेवा' },
  'contactUs': { en: 'Contact Us', mr: 'आमच्याशी संपर्क साधा', hi: 'हमसे संपर्क करें' },
  'hours': { en: 'Hours', mr: 'वेळ', hi: 'समय' },
  'openDaily': { en: 'Open Daily', mr: 'दररोज उघडे', hi: 'रोज़ खुला' },
  'callForHours': { en: 'Call for delivery hours', mr: 'डिलिव्हरी वेळेसाठी कॉल करा', hi: 'डिलीवरी समय के लिए कॉल करें' },
  'allRightsReserved': { en: 'All rights reserved.', mr: 'सर्व हक्क राखीव.', hi: 'सर्वाधिकार सुरक्षित।' },

  // Errors
  'nameError': { en: 'Name must be at least 2 characters', mr: 'नाव किमान २ अक्षरांचे असावे', hi: 'नाम कम से कम 2 अक्षरों का होना चाहिए' },
  'phoneError': { en: 'Please enter a valid 10-digit phone number', mr: 'कृपया वैध १० अंकी फोन नंबर टाका', hi: 'कृपया एक मान्य 10 अंकों का फ़ोन नंबर दर्ज करें' },
  'addressError': { en: 'Address is required for home delivery', mr: 'होम डिलिव्हरीसाठी पत्ता आवश्यक आहे', hi: 'होम डिलीवरी के लिए पता आवश्यक है' },
  'fixErrors': { en: 'Please fix the errors', mr: 'कृपया त्रुटी दुरुस्त करा', hi: 'कृपया त्रुटियां ठीक करें' },
  'orderPlaced': { en: 'Order placed successfully!', mr: 'ऑर्डर यशस्वीरित्या दिली!', hi: 'ऑर्डर सफलतापूर्वक दिया गया!' },
  'orderFailed': { en: 'Failed to place order. Please try again.', mr: 'ऑर्डर देता आली नाही. कृपया पुन्हा प्रयत्न करा.', hi: 'ऑर्डर देने में विफल। कृपया पुनः प्रयास करें।' },
  'geoNotSupported': { en: 'Geolocation is not supported by your browser', mr: 'तुमचा ब्राउझर स्थान शेअरिंग सपोर्ट करत नाही', hi: 'आपका ब्राउज़र जियोलोकेशन सपोर्ट नहीं करता' },
  'locationSuccess': { en: 'Location captured successfully!', mr: 'स्थान यशस्वीरित्या कॅप्चर केले!', hi: 'स्थान सफलतापूर्वक कैप्चर किया गया!' },
  'locationFailed': { en: 'Failed to capture location. Please enable location permissions.', mr: 'स्थान कॅप्चर करता आले नाही. कृपया स्थान परवानगी सक्षम करा.', hi: 'स्थान कैप्चर करने में विफल। कृपया स्थान अनुमति सक्षम करें।' },

  // Theme
  'darkMode': { en: 'Dark Mode', mr: 'डार्क मोड', hi: 'डार्क मोड' },
  'lightMode': { en: 'Light Mode', mr: 'लाइट मोड', hi: 'लाइट मोड' },
};

export const t = (key: TranslationKey, language: Language): string => {
  return translations[key]?.[language] || translations[key]?.['en'] || key;
};

export const getName = (item: { nameEn: string; nameMr: string; nameHi?: string }, language: Language): string => {
  if (language === 'hi') return item.nameHi || item.nameEn;
  if (language === 'mr') return item.nameMr;
  return item.nameEn;
};

export const getDescription = (item: { descriptionEn?: string; descriptionMr?: string; descriptionHi?: string }, language: Language): string => {
  if (language === 'hi') return item.descriptionHi || item.descriptionEn || '';
  if (language === 'mr') return item.descriptionMr || '';
  return item.descriptionEn || '';
};

export const getSecondaryName = (item: { nameEn: string; nameMr: string; nameHi?: string }, language: Language): string => {
  if (language === 'en') return item.nameMr;
  return item.nameEn;
};

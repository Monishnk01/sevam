import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBJoyp53UYJioa3FQdCgpmGhG2yKl2_6E",
  authDomain: "sevam-c561c.firebaseapp.com",
  projectId: "sevam-c561c",
  storageBucket: "sevam-c561c.firebasestorage.app",
  messagingSenderId: "384918204342",
  appId: "1:384918204342:web:04f3a2652d1b545cd09b17"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- SERVICE LAYER ---

// Add a new food donation (Donor)
export const addDonation = async (donationData) => {
  try {
    const donationsRef = collection(db, "foodDonations");
    const snapshot = await getDocs(donationsRef);
    const count = snapshot.size + 1;
    const donationId = `FD${count.toString().padStart(3, '0')}`;

    // Clean data to strictly prevent any undefined values breaking Firestore
    const cleanData = Object.fromEntries(
      Object.entries(donationData).map(([k, v]) => [k, v === undefined ? null : v])
    );

    const fullData = {
      donationId,
      ...cleanData,
      status: "Pending",
      createdAt: serverTimestamp()
    };

    await addDoc(donationsRef, fullData);
    return donationId;
  } catch (error) {
    console.error("Firebase addDonation Error:", error);
    throw error;
  }
};

// Real-time listener for all donations
export const getDonations = (callback) => {
  const q = query(collection(db, "foodDonations"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const donations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(donations);
  }, (error) => {
    console.error("Firebase getDonations Error:", error);
    // If it fails (e.g. index error, permissions), trigger callback with empty so UI isn't hung
    callback([]);
  });
};

// Get single donation by ID
export const getDonationById = async (docId) => {
  const docRef = doc(db, "foodDonations", docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// Update donation status
export const updateDonationStatus = async (docId, newStatus) => {
  const docRef = doc(db, "foodDonations", docId);
  await updateDoc(docRef, {
    status: newStatus
  });
};

// Accept a donation (Distributor / Receiver)
export const acceptDonation = async (docId, donationData, acceptedByData) => {
  // 1. Update Donation Status
  const docRef = doc(db, "foodDonations", docId);
  await updateDoc(docRef, {
    status: "Claimed",
    acceptedBy: acceptedByData.name,
    acceptedById: acceptedByData.uid,
    acceptedByEmail: acceptedByData.email,
    acceptedTime: serverTimestamp(),
    deliveryStatus: "Assigned"
  });

  // 2. Create Delivery Record
  const deliveriesRef = collection(db, "deliveries");
  const deliverySnapshot = await getDocs(deliveriesRef);
  const deliveryCount = deliverySnapshot.size + 1;
  const deliveryId = `DLV${deliveryCount.toString().padStart(3, '0')}`;

  await addDoc(deliveriesRef, {
    deliveryId,
    donationId: donationData.donationId,
    foodName: donationData.foodName,
    acceptedBy: acceptedByData.uid,
    acceptedByRole: acceptedByData.role,
    receiverName: acceptedByData.name,
    receiverEmail: acceptedByData.email,
    receiverPhone: acceptedByData.phone || "",
    pickupLocation: donationData.pickupLocation,
    dropLocation: "Determined dynamically", // can be updated later
    acceptedTime: serverTimestamp(),
    deliveredTime: null,
    deliveryStatus: "In Transit"
  });
};

// Deliver a donation (Update Delivery Status)
export const deliverDonation = async (donationDocId) => {
  // Update donation status
  await updateDonationStatus(donationDocId, "Delivered");
  // The actual delivery doc should also be updated ideally, 
  // but keeping it simple as per requirements.
};

// Real-time listener for users
export const getUsers = (callback) => {
  const q = collection(db, "users");
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(users);
  });
};

// --- AI MODEL DATA ---

// Add a single historical data row
export const addHistoricalData = async (data) => {
  const historyRef = collection(db, "historicalData");
  await addDoc(historyRef, {
    ...data,
    createdAt: serverTimestamp()
  });
};

// Listen to historical data for a specific user
export const getHistoricalData = (userId, callback) => {
  const q = query(collection(db, "historicalData"));
  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).filter(d => d.restaurantId === userId);
    callback(history);
  }, (error) => {
    console.error("Firebase getHistoricalData Error:", error);
    callback([]);
  });
};

// --- RECEIVER REQUIREMENTS ---

// Add a new requirement (Receiver)
export const addRequirement = async (requirementData) => {
  try {
    const requirementsRef = collection(db, "receiverRequirements");
    const snapshot = await getDocs(requirementsRef);
    const count = snapshot.size + 1;
    const requirementId = `REQ${count.toString().padStart(3, '0')}`;

    // Clean data to strictly prevent any undefined values breaking Firestore
    const cleanData = Object.fromEntries(
      Object.entries(requirementData).map(([k, v]) => [k, v === undefined ? null : v])
    );

    const fullData = {
      requirementId,
      ...cleanData,
      status: "Active",
      createdAt: serverTimestamp()
    };

    await addDoc(requirementsRef, fullData);
    return requirementId;
  } catch (error) {
    console.error("Firebase addRequirement Error:", error);
    throw error;
  }
};

// Real-time listener for all requirements
export const getRequirements = (callback) => {
  const q = query(collection(db, "receiverRequirements"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const requirements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(requirements);
  }, (error) => {
    console.error("Firebase getRequirements Error:", error);
    callback([]);
  });
};


# PCAP Mobile MVP — শুরু করার নির্দেশনা

## এটি কী?
PCAP (Packaging Client Acquisition Platform)-এর প্রথম Mobile-first prototype। Android Chrome-এ ব্যবহার করার জন্য তৈরি।

## এখন কী কাজ করে?
- মোবাইল Dashboard
- Lead যোগ করা
- Company, Country, Industry, Website ও packaging opportunity সংরক্ষণ
- Lead search ও status filter
- Lead status update / delete
- JSON backup export
- PWA service worker shell

## গুরুত্বপূর্ণ সীমাবদ্ধতা
এই MVP-তে Lead ডেটা বর্তমানে ফোনের browser-এর `localStorage`-এ থাকে। এটি এখনো Cloud Database নয়, AI Research করে না এবং স্বয়ংক্রিয়ভাবে ক্লায়েন্ট খুঁজে বা মেসেজ পাঠায় না। Browser data clear করলে ডেটা হারাতে পারে। তাই নিয়মিত Export দিয়ে backup রাখুন।

## Android ফোন থেকে চালানোর সহজ উপায়
1. ZIP extract করে ফাইলগুলো একটি static hosting service-এ upload করতে হবে।
2. HTTPS URL Chrome-এ খুলতে হবে।
3. Chrome menu থেকে "Add to Home screen" বা "Install app" নির্বাচন করতে হবে।
4. প্রথমে একটি test lead যোগ করে দেখুন।
5. Export বাটনে চাপ দিয়ে JSON backup নামিয়ে রাখুন।

শুধু HTML ফাইল সরাসরি খুললে PWA install/offline support নাও কাজ করতে পারে; HTTPS hosting ব্যবহার করুন।

## পরবর্তী Development
1. Secure cloud database + authentication
2. Lead research sources and verification
3. AI scoring with transparent evidence
4. Approval queue for outreach
5. CRM timeline, follow-up and reporting

## নিরাপত্তা
- ব্যক্তিগত সংবেদনশীল তথ্য অপ্রয়োজনে সংরক্ষণ করবেন না।
- কেবল বৈধভাবে সংগ্রহ করা ব্যবসায়িক তথ্য ব্যবহার করুন।
- USA/Canada outreach করার আগে CAN-SPAM/CASL এবং platform terms যাচাই করুন।

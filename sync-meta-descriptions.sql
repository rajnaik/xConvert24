-- sync-meta-descriptions.sql
-- Generated from Layout description props across all pages
-- Skips: bitcoin-halving-explained, bitcoin-vs-gold, understanding-bitcoin-supply,
--        what-are-satoshis, body-weight-percentage, cycling-speed, oven-temperature,
--        precious-metals, running-pace (already in DB)

-- ============================================================
-- TOP-LEVEL PAGES
-- ============================================================
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/', 'Free Online Unit Converter & Calculators. Get 100% accurate results for 34+ tools including weight, length, & loans. No sign-up or ads. Start converting now!');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/about/', 'About xConvert24 — free, fast, accurate unit converters and calculators. No sign-up, no ads, no tracking. Built for everyone. Start using our fast, free conversion tools today!');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/contact/', 'Get in touch with xConvert24. Report bugs, suggest features, or ask questions. We respond to every message.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/cookies/', 'Cookie Policy for xConvert24. See what cookies we use, why they exist, and how to manage or disable them.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/disclaimer/', 'Legal disclaimer for xConvert24. Understand limitations of liability, accuracy notes, and acceptable use of our free tools.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/embed/', 'Add a free xConvert24 converter widget to your website. Copy one line of code — supports weight, length, temperature, and more.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/faq/', 'Answers to common questions about xConvert24. Learn about accuracy, privacy, supported units, and how to use our free tools.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/favourites/', 'Your saved favourite converters and tools. Quick access to the xConvert24 tools you use most — stored locally, no sign-up.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/guide/', 'Quick guide to using xConvert24. Learn to convert units, use calculators, search tools, and personalise your experience.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/install/', 'Install xConvert24 on your phone or tablet. Add to home screen for instant access like a native app — step-by-step guide.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/opinion/', 'Share your opinion on xConvert24 features. Should we add email sign-on? Your voice shapes our platform''s future.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/privacy/', 'Privacy Policy for xConvert24. Learn how we handle data, cookies, and analytics. Your conversions stay in your browser.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/profile/', 'Your xConvert24 profile. Track ConvertCoins, streaks, milestones, and level progression. See your contribution history.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/releases/', 'xConvert24 release notes — see what''s new, improved, and fixed in each version. We ship updates weekly.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/report-bug/', 'Found a bug on xConvert24? Report it here. Select the affected tool, describe the issue, and we''ll fix it fast.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/rewards/', 'Earn ConvertCoins on xConvert24. Complete activities, maintain streaks, level up, and build your balance — all free. Build your streak and join the xConvert24 community!');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/roadmap/', 'See what''s next for xConvert24. Upcoming features, planned tools, and community-voted improvements. Your voice shapes our future.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/search/', 'Search all converters and tools on xConvert24. Find any unit, calculator, or blog post instantly.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/suggest/', 'Suggest a new converter or tool for xConvert24. Tell us what you need — community ideas get built first.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/suggestions/', 'View and vote on suggested converters and tools. Highest-rated community ideas get built first on xConvert24.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/support/', 'Support xConvert24 with a Solana donation. Help keep our tools free, fast, and ad-free for students, professionals, and everyone.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/terms/', 'Terms and Conditions for xConvert24. Understand usage rights, limitations, and acceptable use of our free tools.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/vote-bugs/', 'Help us prioritise — vote on the bugs you want fixed first on xConvert24. Your vote moves fixes up the queue.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/build-pipeline/', 'Our 13-step CI/CD pipeline. From code to Golden certification with quality gates at every stage. See how we ship.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tech-stack/', 'The tech stack behind xConvert24. From Astro and Cloudflare Workers to AI-powered development with Kiro. Experience the speed of our Astro-powered tools today.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/404/', 'Page not found. Head back to xConvert24 and find the converter or tool you need — all free, instant, no sign-up.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/500/', 'Something went wrong. We''re fixing it. Head back to xConvert24 for free converters and tools — no sign-up needed.');

-- ============================================================
-- CONVERTER PAGES
-- ============================================================
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/angle/', 'Free Angle Converter. Convert degrees to radians, gradians & turns instantly. Accurate, fast, and no sign-up needed.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/area/', 'Free Online Area Converter. Easily switch between square feet, meters, acres, and more. Get instant, accurate results for all your area calculations. No ads.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/base/', 'Number Base Converter. Convert decimal to binary, hex & octal instantly. Free, fast, and accurate. No sign-up required.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/clothing-size/', 'Clothing Size Converter. Convert US, UK, EU & Asian sizes for tops and trousers. Free, instant, and accurate.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/cooking/', 'Cooking Measurement Converter. Convert cups to mL, tablespoons to grams instantly. Perfect for precision baking, recipe scaling, and sous vide prep. No sign-up, no ads, just instant results.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/currency/', 'Free Currency Converter. Convert USD, EUR, GBP & 17 major currencies with reference rates. Check the latest reference rates for USD, EUR, GBP, and more instantly.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/data/', 'Free Data Storage Converter. Convert MB to GB, TB to bytes, binary & decimal units. Ideal for IT professionals and students. Fast, free, and accurate. Try it now!');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/energy/', 'Free Energy Converter. Convert joules, calories, kWh & BTU instantly. 100% accurate, no ads, no sign-up. Start converting now!');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/frequency/', 'Instant Frequency Converter. Convert Hz to kHz, MHz, GHz & RPM in seconds. Free, accurate, no sign-up. Try it now!');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/fuel/', 'Fuel Economy Converter. Convert MPG to L/100km and km/L instantly. Free, accurate, and easy to use. No sign-up required.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/length/', 'Fast Length & Distance Converter. Quickly convert inches to cm, miles to km, and feet to meters. Free, 100% accurate, and no sign-up hassle. Try it today!');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/power/', 'Free Power Converter. Convert watts to horsepower, kW to HP instantly. Accurate results with no sign-up or ads. Try it now!');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/pressure/', 'Instant Pressure Converter. Convert PSI to bar, kPa to atm, and more. Free, accurate results in seconds. No sign-up required.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/roman/', 'Roman Numeral Converter. Convert numbers to Roman numerals and back instantly. Free, accurate, supports vinculum notation.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/shoe-size/', 'Shoe Size Converter. Convert between US, UK, EU & Asian sizes for men and women. Free, instant, and accurate.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/speed/', 'Fast Speed Converter. Convert km/h to mph, knots to m/s, and Mach instantly. Ideal for travel and professional calculations. No ads, no hassle.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/temperature/', 'Instant Temperature Converter. Switch between Celsius, Fahrenheit & Kelvin in seconds. Supports Celsius, Fahrenheit, and Kelvin for all your cooking or scientific needs. Free, accurate, no sign-up.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/time/', 'Free Time Converter. Convert hours to minutes, days to seconds, and more instantly. Accurate results with no sign-up needed.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/volume/', 'Free Volume Converter. Convert litres to gallons, cups to mL, and more instantly. 100% accurate results with no ads or sign-up.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/convert/weight/', 'Online Weight & Mass Converter. Convert kilograms to pounds, grams to ounces, and more instantly. Free, accurate, and easy to use. No sign-up required.');

-- ============================================================
-- TOOL PAGES
-- ============================================================
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/age/', 'Free Age Calculator. Find your exact age in years, months & days from your date of birth. Instant, accurate, no sign-up.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/alarm/', 'Free online alarm clock. Set multiple alarms with custom labels and sounds. Runs in your browser — no app needed.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/aspect-ratio/', 'Free aspect ratio calculator. Find ratios from dimensions, calculate missing values, and browse common screen ratios instantly.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/audio-converter/', 'Convert audio between WAV, MP3, OGG, and WebM free in your browser. No upload, no server — fully private.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/audio-formats/', 'Complete guide to audio formats — MP3, WAV, FLAC, AAC, OGG. Learn bitrates, codecs, and which format fits your needs.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/bmi/', 'Free BMI Calculator. Enter height & weight for instant results with WHO categories and healthy range. No sign-up required.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/calculator/', 'Free Scientific Calculator. Trig, log, powers, π & e. Supports DEG/RAD modes. Fast, accurate, no sign-up or ads required.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/clock/', 'Free World Clock. See live times in 12+ cities worldwide. Add, remove cities, auto-updates every second. No sign-up needed.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/color/', 'Free Color Picker. Convert between RGB, HEX, HSL & CMYK instantly. Copy codes with one click. No sign-up or ads needed.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/contagion/', 'Track global disease outbreaks in real-time. COVID-19, Ebola, Hantavirus — live case counts, deaths, and recovery data.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/crypto-bubbles/', 'Crypto market as interactive floating bubbles. Size = market cap, color = price change. Powered by D3.js physics.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/crypto-coins/', 'Live prices for the top 100 cryptocurrencies. Track price changes, market cap, and supply — updated in real-time.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/date-diff/', 'Free Date Difference Calculator. Find the exact days, weeks & months between any two dates. Instant results, no sign-up.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/discount/', 'Free Discount Calculator. Find sale prices and savings instantly. Enter price & percentage for accurate results. No sign-up.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/distance-map/', 'Free map tools — measure distances, find nearby places, plan routes, and explore. Powered by Amazon Location Service.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/epoch/', 'Free epoch/Unix timestamp converter. Convert timestamps to dates and back. Live clock, relative time, and quick presets.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/guitar-tuner/', 'Free online guitar tuner with real-time pitch detection. Uses your mic to show frequency, cents deviation, and waveform.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/image-converter/', 'Convert images between PNG, JPG, WebP, BMP, and SVG. Resize and adjust quality — all in your browser, nothing uploaded.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/image-editor/', 'Free image editor — crop, resize, rotate, adjust brightness, add watermarks. All processing in your browser, nothing uploaded.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/loan/', 'Free Loan Calculator. Estimate your monthly payments and total interest instantly. Fast, accurate, and easy to use. No sign-up required. Start planning today!');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/morse/', 'Free Morse code translator. Convert text to Morse and back instantly. Play audio with Web Audio API — no sign-up needed.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/password/', 'Generate strong, random passwords instantly. Customise length, characters, and batch-generate with a strength meter. Ensure your online security with our 100% free, browser-based tool. No data is ever stored.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/reminder/', 'Free online reminder tool. Set countdown timers with custom messages and get notified when time''s up. No app needed.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/ruler/', 'Free on-screen ruler. Measure in cm, mm, and inches. Calibrate for accurate real-world measurements on any device.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/scrabble/', 'Free Scrabble word finder. Enter your tiles and find the highest-scoring words. Works for Words With Friends too.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/stopwatch/', 'Free online stopwatch with lap times, split tracking, and millisecond precision. Start, stop, lap — instant and accurate.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/tip/', 'Free Tip Calculator. Calculate tips and split bills instantly. Choose custom percentages and group sizes. No sign-up needed.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/video-converter/', 'Convert video between MP4 and WebM, trim clips, and resize — all in your browser. No upload, fully private and free.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/tools/video-formats/', 'Complete guide to video formats — MP4, AVI, MKV, WebM, MOV. Learn codecs, containers, and which format to use when.');

-- ============================================================
-- BLOG PAGES (excluding 9 already in DB)
-- ============================================================
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/', 'Helpful articles about unit conversion, measurement systems, currency exchange, crypto, and everyday calculation tips.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/age-calculator-exact-days-alive/', 'Calculate your exact age in days, hours, and minutes. Discover fun milestones and how age is counted across cultures.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/baby-weight-conversion-chart/', 'Baby weight conversion chart — lbs to kg. Quick reference for new parents to understand newborn weight in both units.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/best-time-to-exchange-currency/', 'When to exchange currency for the best rates. Timing strategies, seasonal patterns, and tips to stretch your travel money.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/binary-vs-decimal-storage-confusion/', 'Why your 500GB drive shows 465GB. The binary vs decimal storage difference explained simply with the actual math.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/bmi-limitations-muscle-vs-fat/', 'Why BMI fails for athletes and muscular people. Learn the limitations and better alternatives for body composition.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/bmi-what-is-a-healthy-weight/', 'BMI explained — how to calculate it, what the ranges mean, and how to interpret your score for health assessment.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/body-weight-metric-vs-imperial/', 'Track body weight in kg or lbs? Compare precision, ease of tracking, and which unit works better for fitness goals.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/calories-vs-kilocalories/', 'The confusing cal/kcal distinction explained. Understand what food labels mean and how energy units work.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/compound-interest-explained/', 'Compound interest explained with examples. See how small amounts grow over time and why starting early matters so much.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/cups-to-ml-baking-conversion/', 'Convert cups to ml for international baking. Covers US, metric, and imperial cups with a handy chart.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/driving-distances-km-vs-miles/', 'Quick conversions for road trips across borders. Convert km to miles and miles to km with simple tricks.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/feet-and-inches-to-cm-height/', 'Convert height between feet/inches and centimeters. Reference chart for common heights and the exact conversion formula.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/fever-temperature-what-is-normal/', 'What temperature is a fever? Normal ranges in Celsius and Fahrenheit for adults and children with clear thresholds.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/freezing-and-boiling-points-all-scales/', 'Freezing and boiling points across Celsius, Fahrenheit, Kelvin, and Rankine. How each temperature scale was defined.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/fuel-economy-mpg-vs-l100km/', 'MPG vs L/100km explained. Convert between fuel economy units and understand why they measure efficiency differently.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/gold-weight-troy-ounces/', 'Why gold uses a different ounce system. Understand troy ounces vs regular ounces and how gold is weighed.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/grams-to-ounces-for-cooking/', 'Grams to ounces conversion chart for cooking and baking. Common ingredient weights and tips for accurate measurements.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/healthy-weight-loss-rate-per-week/', 'Safe weight loss per week explained. The science behind sustainable fat loss vs crash dieting — know what really works.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/hex-color-codes-explained/', 'How HEX color codes work in web design. Read, write, and modify colours like #FF5733 with practical examples and tips.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/horsepower-vs-kilowatts-cars/', 'What HP and kW mean for your vehicle. Learn how to convert between horsepower and kilowatts with simple formulas.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/how-exchange-rates-work/', 'How currency exchange rates work, why they fluctuate, and what affects money value when you travel or send funds abroad.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/how-far-is-a-nautical-mile/', 'What is a nautical mile? How it relates to regular miles and km, and why ships and planes use this unique distance unit.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/how-many-days-until-christmas/', 'How many days until Christmas? Date calculation tips and how to count days between any two dates for planning.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/how-many-liters-in-a-gallon/', 'How many liters in a gallon? US vs Imperial gallons explained with examples for fuel, milk, and water conversion.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/how-much-is-1tb-of-storage/', 'Putting terabytes in real-world perspective. See how many photos, songs, and movies fit in 1TB.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/how-tall-is-6-feet-in-cm/', 'Convert 6 feet to centimetres and understand height conversions between imperial and metric systems.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/how-to-convert-celsius-to-fahrenheit/', 'Celsius to Fahrenheit formula, mental math shortcuts, and a temperature chart. Convert any temperature in seconds.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/how-to-convert-kg-to-lbs/', 'Learn how to convert kg to lbs with formulas, mental math tricks, and reference charts. Free guide with instant converter link.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/internet-speed-mbps-explained/', 'What Mbps means for your internet. The difference between Mbps and MBps, what speeds you need, and how to test yours.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/luggage-weight-kg-to-lbs/', 'Airline luggage weight limits — kg to lbs. Know exactly how much you can pack with quick reference for common airlines.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/mb-vs-gb-explained-simply/', 'Data storage units demystified. Understand MB, GB, TB and how they relate to everyday files, photos, and videos.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/miles-to-kilometers-running/', 'Miles to km for runners. Convert 5K, 10K, half marathon, and marathon distances with pace conversion tips.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/mortgage-vs-rent-calculator-guide/', 'When buying makes financial sense vs renting. Break-even analysis, hidden costs, and how to calculate your numbers.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/oven-temperatures-celsius-fahrenheit/', 'Oven temperature conversion chart for baking. Celsius to Fahrenheit quick reference with gas mark equivalents.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/pomodoro-technique-timer-guide/', 'The Pomodoro Technique — how 25-minute focused intervals with breaks can help you get more done. Free guide.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/rgb-vs-cmyk-when-to-use/', 'RGB vs CMYK — when to use each colour model. Why colours look different on screen vs print and how to convert between them.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/room-measurements-meters-to-feet/', 'Convert room dimensions from meters to feet for furniture shopping. Measure rooms and ensure your furniture fits perfectly.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/speed-limits-around-the-world/', 'Speed limits worldwide in mph and km/h by country. See which system each country uses and the fastest legal highways.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/tablespoon-to-ml-medicine/', 'Tablespoon to mL for accurate medicine dosing. Why kitchen spoons are unreliable and how to measure doses correctly.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/understanding-cryptocurrency-basics/', 'Cryptocurrency basics — what Bitcoin and Ethereum are, how they work, and a beginner-friendly introduction to digital currency.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/understanding-millimeters-in-engineering/', 'Why engineers use millimeters instead of centimeters. Precision, convention, and how mm reduces errors in technical work.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/understanding-tire-pressure-psi/', 'What your tyre pressure numbers mean and how to convert between PSI, Bar, and kPa. Includes recommended pressures.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/us-vs-uk-pint-difference/', 'US pint vs UK pint — why they''re different sizes, the historical reasons, and how to convert between the two systems.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/water-intake-liters-per-day/', 'How much water should you drink daily? Amounts in liters, glasses, and ounces with factors that affect your needs.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/weather-temperature-conversion-travel/', 'Quick Celsius/Fahrenheit reference for travellers. Understand weather forecasts abroad and know what to wear instantly.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/what-is-a-stone-in-weight/', 'What is a stone in weight? How to convert stones to kg and lbs, and why the UK still uses this traditional unit.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/what-is-kelvin-temperature/', 'What is Kelvin? The absolute temperature scale, why scientists use it, and how it relates to Celsius and Fahrenheit.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/what-is-mach-speed/', 'What Mach numbers mean, how fast the speed of sound is, and why breaking the sound barrier creates a sonic boom.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/why-world-uses-different-units/', 'Why the world uses metric and imperial. How measurement systems evolved and why some countries still haven''t switched.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/wind-speed-knots-to-mph/', 'Wind speed in knots to mph and km/h. Understand the Beaufort scale and what wind speeds mean for sailing and flying.');
INSERT OR IGNORE INTO meta (url, meta_description) VALUES ('/blog/world-time-zones-explained/', 'How time zones work, UTC offsets, daylight saving, and tips for scheduling across time zones.');

/** Built-in, fully editable mini-game content. Survey rankings and point values are
 * fictional, illustrative game values, NOT collected survey responses.
 * Questions intentionally use stable, non-time-sensitive facts.
 */
const POINTS=[
 [35,25,18,13,9],[32,26,20,14,8],[30,27,20,15,8],
 [34,24,20,12,10],[31,25,21,14,9],[36,24,18,13,9],
 [33,26,19,13,9],[30,25,22,15,8]
];
function s(id,question,choices,multiplier=1){
  if(choices.length!==5)throw Error(id+' needs five illustrative answers');
  return {id,question,multiplier,answers:choices.map((text,i)=>({text,points:POINTS[Number(id.match(/[0-9]+$/)?.[0]||1)%POINTS.length][i]}))};
}
function q(id,question,options,answer,explanation){return {id,question,options,answer,explanation};}

/** The original IDs are preserved so existing deep links and tests keep working.
 * Extend their small warm-up collections to eight playable questions each. */
export const TEMPLATE_ADDITIONS={
 'survey-classroom-v1':[
  s('sc4','Name something that makes a group project easier!',['Clear tasks','Team communication','Shared notes','A deadline','A group leader'],2),
  s('sc5','Name a place students might study outside the classroom!',['Library','Home','Cafe','Study lounge','Park'],2),
  s('sc6','Name something a teacher might bring to a lesson!',['Laptop','Lesson notes','Marker','Handouts','Projector remote'],2),
  s('sc7','Name a way to make a presentation less stressful!',['Practice','Prepare notes','Work with friends','Take a breath','Arrive early'],3),
  s('sc8','Name something people appreciate in a good class!',['Clear explanations','Helpful feedback','Interesting activities','Friendly classmates','Practical examples'],3)
 ],
 'survey-community-v1':[
  s('se4','Name something people might do while waiting for an event to start!',['Chat with others','Take photos','Find a seat','Check the schedule','Get a drink'],2),
  s('se5','Name something an event host might need!',['Microphone','Run sheet','Timer','Speaker system','Name cards'],2),
  s('se6','Name a reason people attend a community festival!',['Meet friends','Try food','Watch performances','Play games','See something new'],2),
  s('se7','Name something that helps guests feel welcome!',['Warm greeting','Clear directions','Friendly volunteers','Comfortable seats','Refreshments'],3),
  s('se8','Name something people remember after a great party!',['Funny moments','Good food','New friends','Music','Photos'],3)
 ],
 'quickfire-computing-v1':[
  q('qc5','Which of these is a programming language?',['JPEG','Python','Bluetooth','HDMI'],1,'Python is a general-purpose programming language.'),
  q('qc6','What does URL stand for?',['Uniform Resource Locator','Universal Record List','User Routing Layer','United Reference Link'],0,'A URL is a Uniform Resource Locator, used to identify a resource on the web.'),
  q('qc7','Which device is commonly used to enter text into a computer?',['Monitor','Printer','Keyboard','Projector'],2,'A keyboard is a common text-input device.'),
  q('qc8','Which is usually a safer password practice?',['Use one password everywhere','Share passwords in chat','Use long unique passwords','Write passwords in public'],2,'Long, unique passwords reduce the impact of a single compromised account.')
 ],
 'quickfire-general-v1':[
  q('qe5','How many sides does a hexagon have?',['Five','Six','Seven','Eight'],1,'A hexagon is a polygon with six sides.'),
  q('qe6','What instrument measures temperature?',['Thermometer','Compass','Ruler','Barometer'],0,'A thermometer measures temperature.'),
  q('qe7','What is the capital of Japan?',['Kyoto','Osaka','Tokyo','Nagoya'],2,'Tokyo is the capital of Japan.'),
  q('qe8','Which part of a plant typically absorbs water from the soil?',['Flowers','Roots','Fruits','Petals'],1,'Roots typically take up water and dissolved minerals from the soil.')
 ]
};

export const NEW_SETS=[
 {id:'survey-family-v1',game:'survey',title:'Family Fun & Celebrations',category:'Family',description:'Eight playful questions about everyday family moments. Fictional survey rankings and scores.',audience:'All ages',minutes:'20–30 min',questions:[
  s('sf1','Name something people might do together on a rainy day!',['Play board games','Watch a movie','Cook snacks','Read books','Tell stories'],1),
  s('sf2','Name something often found at a birthday party!',['Cake','Balloons','Gifts','Candles','Music'],1),
  s('sf3','Name something children might pack for a sleepover!',['Pajamas','Toothbrush','Favorite toy','Pillow','Change of clothes'],1),
  s('sf4','Name something people do before a family photo!',['Smile','Fix their hair','Find a spot','Gather everyone','Check the camera'],2),
  s('sf5','Name a game people might play at a family gathering!',['Charades','Card games','Trivia quiz','Hide-and-seek','Musical chairs'],2),
  s('sf6','Name something people take on a picnic!',['Blanket','Food','Drinks','Basket','Sunscreen'],2),
  s('sf7','Name something that makes a family trip memorable!',['Shared laughter','New places','Good food','Photos','Surprises'],3),
  s('sf8','Name something guests might say when leaving a celebration!',['Thank you','See you soon','It was fun','Good night','Take care'],3)
 ]},
 {id:'survey-everyday-v1',game:'survey',title:'Everyday Life Showdown',category:'Social',description:'Everyday routines, food and shared experiences. Fictional survey rankings and scores.',audience:'Teens & adults',minutes:'20–30 min',questions:[
  s('sl1','Name something people do just after waking up!',['Check the time','Wash their face','Drink water','Stretch','Make breakfast'],1),
  s('sl2','Name something people often forget when leaving home!',['Keys','Phone','Wallet','Umbrella','Water bottle'],1),
  s('sl3','Name a reason someone might be late!',['Traffic','Oversleeping','Missed transport','Bad weather','Lost keys'],1),
  s('sl4','Name something someone might order at a cafe!',['Coffee','Tea','Cake','Sandwich','Juice'],2),
  s('sl5','Name something people do to relax after work or class!',['Watch a show','Listen to music','Take a walk','Talk with friends','Take a nap'],2),
  s('sl6','Name something that can make a commute more comfortable!',['Headphones','A book','A seat','Water','A charged phone'],2),
  s('sl7','Name something people compare before buying a product!',['Price','Quality','Reviews','Size','Warranty'],3),
  s('sl8','Name something that can improve a busy day!',['A clear plan','A short break','A kind message','Enough sleep','A good meal'],3)
 ]},
 {id:'survey-travel-v1',game:'survey',title:'Travel & Culture Adventure',category:'Travel',description:'Travel-day situations and shared discoveries. Fictional survey rankings and scores.',audience:'All ages',minutes:'20–30 min',questions:[
  s('st1','Name something people usually pack for a trip!',['Clothes','Phone charger','Toiletries','Travel documents','Medicine'],1),
  s('st2','Name something people might buy as a souvenir!',['Keychain','Postcard','Snack','Magnet','Local craft'],1),
  s('st3','Name something travelers do at a train station!',['Check the platform','Buy a ticket','Wait','Read the timetable','Find a seat'],1),
  s('st4','Name something people take photos of on vacation!',['Landmarks','Food','Scenery','Friends and family','Street scenes'],2),
  s('st5','Name something useful when visiting a new city!',['Map','Transit card','Comfortable shoes','Phone','Weather forecast'],2),
  s('st6','Name a food experience people enjoy when traveling!',['Street food','Local dessert','Restaurant meal','Market snacks','Traditional breakfast'],2),
  s('st7','Name something that makes traveling with friends easier!',['Shared itinerary','Clear meeting point','Fair budgeting','Teamwork','Flexible plans'],3),
  s('st8','Name something someone might learn on a cultural trip!',['Local customs','New words','History','Traditional crafts','Local recipes'],3)
 ]},
 {id:'quickfire-science-v1',game:'quickfire',title:'Science & Nature Explorer',category:'Education',description:'Eight objective questions across everyday biology, chemistry, Earth and space.',audience:'Teens & adults',minutes:'10–20 min',questions:[
  q('qs1','Which gas do plants absorb during photosynthesis?',['Oxygen','Carbon dioxide','Helium','Nitrogen'],1,'Plants absorb carbon dioxide to produce sugars during photosynthesis.'),
  q('qs2','At sea level, about what temperature does pure water freeze?',['0°C','10°C','50°C','100°C'],0,'Pure water freezes at approximately 0°C under normal atmospheric pressure.'),
  q('qs3','Which organ pumps blood around the human body?',['Liver','Kidney','Heart','Lung'],2,'The heart pumps blood through the circulatory system.'),
  q('qs4','Which force pulls objects toward Earth?',['Friction','Magnetism','Buoyancy','Gravity'],3,'Gravity attracts objects with mass toward Earth.'),
  q('qs5','Which celestial body is Earth’s natural satellite?',['The Moon','Mars','The Sun','Venus'],0,'The Moon is Earth’s natural satellite.'),
  q('qs6','What is the chemical symbol for gold?',['Ag','Au','Fe','O'],1,'Au is the chemical symbol for gold, from the Latin aurum.'),
  q('qs7','Which part of a plant usually contains seeds after fertilization?',['Roots','Stem','Fruit','Leaf'],2,'In flowering plants, the fruit develops from the ovary and typically contains seeds.'),
  q('qs8','What tool can be used to see very small cells?',['Telescope','Compass','Altimeter','Microscope'],3,'A microscope makes small structures such as cells visible.')
 ]},
 {id:'quickfire-world-v1',game:'quickfire',title:'World, Travel & Culture',category:'Travel',description:'Eight accessible geography and world-culture questions for mixed groups.',audience:'All ages',minutes:'10–20 min',questions:[
  q('qw1','Which country has the city of Kyoto?',['China','Japan','South Korea','Thailand'],1,'Kyoto is a city in Japan.'),
  q('qw2','Which is the largest ocean on Earth?',['Atlantic Ocean','Indian Ocean','Arctic Ocean','Pacific Ocean'],3,'The Pacific is the largest ocean by surface area.'),
  q('qw3','Which continent includes Brazil?',['Africa','Asia','South America','Europe'],2,'Brazil is located in South America.'),
  q('qw4','Which of these is a high-speed rail service in Japan?',['Shinkansen','Gondola','Ferry','Cable car'],0,'Shinkansen is Japan’s high-speed rail system.'),
  q('qw5','Which country is home to the city of Yogyakarta?',['Malaysia','Indonesia','Vietnam','Singapore'],1,'Yogyakarta is located on the island of Java in Indonesia.'),
  q('qw6','Which direction is opposite to east?',['North','South','West','Northeast'],2,'West is opposite to east on a compass.'),
  q('qw7','Which item is normally required for international air travel?',['Library card','Loyalty card','Parking ticket','Passport'],3,'A valid passport is generally needed when traveling internationally. Requirements vary by route.'),
  q('qw8','Which mountain is the highest in Japan?',['Mount Fuji','Mount Aso','Mount Tsukuba','Mount Haku'],0,'Mount Fuji is the highest mountain in Japan.')
 ]},
 {id:'quickfire-math-v1',game:'quickfire',title:'Math & Logic Challenge',category:'Education',description:'Eight friendly number, pattern and reasoning questions with worked explanations.',audience:'Teens & adults',minutes:'10–20 min',questions:[
  q('qm1','What is 15 + 27?',['32','42','44','52'],1,'15 + 27 = 42.'),
  q('qm2','What is 9 × 6?',['45','48','54','63'],2,'Nine groups of six equal 54.'),
  q('qm3','Which number comes next: 2, 4, 8, 16, ...?',['18','20','24','32'],3,'Each number is double the previous one: 16 × 2 = 32.'),
  q('qm4','A rectangle is 5 cm long and 3 cm wide. What is its area?',['8 cm²','15 cm²','16 cm²','30 cm²'],1,'Area = length × width = 5 × 3 = 15 square centimeters.'),
  q('qm5','What fraction is equal to 0.5?',['1/2','1/3','1/4','3/4'],0,'One half equals 0.5.'),
  q('qm6','If a train leaves at 10:15 and travels for 45 minutes, when does it arrive?',['10:45','11:15','11:00','12:00'],2,'10:15 plus 45 minutes is 11:00.'),
  q('qm7','What is the median of 3, 5, 9?',['3','5','6','9'],1,'The middle value of three ordered numbers is 5.'),
  q('qm8','A bag has 4 red balls and 6 blue balls. What fraction are red?',['1/5','1/3','3/5','2/5'],3,'There are 10 balls total, so 4/10 = 2/5 are red.')
 ]}
];

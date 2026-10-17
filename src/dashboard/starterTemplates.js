/** Curated learning/event templates are built into PlayLab. They are NOT user-owned packs,
 * and all Survey counts are illustrative examples rather than actual survey data.
 * Creating a session from a template never modifies the saved question library.
 */
export const STARTER_TEMPLATES=[
  {id:'survey-classroom-v1',game:'survey',title:'Classroom Icebreakers',category:'Education',description:'Illustrative warm-up prompts for a class; not real survey results.',questions:[
    {id:'sc1',question:'Name something students often bring to class!',multiplier:1,answers:[{text:'Notebook',points:35},{text:'Pen',points:25},{text:'Laptop',points:20},{text:'Water bottle',points:12},{text:'Backpack',points:8}]},
    {id:'sc2',question:'Name an activity people enjoy during a study break!',multiplier:2,answers:[{text:'Talking with friends',points:30},{text:'Listening to music',points:25},{text:'Eating snacks',points:20},{text:'Walking',points:15},{text:'Checking messages',points:10}]},
    {id:'sc3',question:'Name something useful for a group presentation!',multiplier:3,answers:[{text:'Slides',points:32},{text:'Practice',points:28},{text:'Clear roles',points:20},{text:'Projector',points:12},{text:'Timer',points:8}]}
  ]},
  {id:'survey-community-v1',game:'survey',title:'Community Game Night',category:'Events',description:'Illustrative social gathering prompts; points are fictional examples.',questions:[
    {id:'se1',question:'Name something people bring to a community gathering!',multiplier:1,answers:[{text:'Food',points:36},{text:'Drinks',points:26},{text:'Games',points:18},{text:'Camera',points:12},{text:'Friends',points:8}]},
    {id:'se2',question:'Name an activity that can make a gathering fun!',multiplier:2,answers:[{text:'Group games',points:34},{text:'Music',points:24},{text:'Eating together',points:20},{text:'Photo session',points:14},{text:'Storytelling',points:8}]},
    {id:'se3',question:'Name a small prize people might enjoy winning!',multiplier:3,answers:[{text:'Snack box',points:34},{text:'Gift card',points:26},{text:'Stationery',points:18},{text:'Book',points:12},{text:'Mug',points:10}]}
  ]},
  {id:'quickfire-computing-v1',game:'quickfire',title:'Computing Fundamentals',category:'Education',description:'Introductory computer and data literacy questions with explanations.',questions:[
    {id:'qc1',question:'Which file extension commonly indicates a plain text file?',options:['.png','.txt','.mp3','.zip'],answer:1,explanation:'A .txt file usually contains plain text.'},
    {id:'qc2',question:'Which component executes instructions in a computer?',options:['CPU','Monitor','Speaker','Mouse'],answer:0,explanation:'The central processing unit executes program instructions.'},
    {id:'qc3',question:'What does a row represent in a typical data table?',options:['A font style','One observation','A screen resolution','A file format'],answer:1,explanation:'Each row commonly represents an observation or record.'},
    {id:'qc4',question:'Which chart best shows the number of items in each category?',options:['Bar chart','Scatter plot','Map only','Audio waveform'],answer:0,explanation:'A bar chart compares counts across categories.'}
  ]},
  {id:'quickfire-general-v1',game:'quickfire',title:'General Knowledge Warm-up',category:'Events',description:'Short, objective team quiz for an event or workshop.',questions:[
    {id:'qe1',question:'How many minutes are in one hour?',options:['30','50','60','90'],answer:2,explanation:'One hour is 60 minutes.'},
    {id:'qe2',question:'Which planet is known as the Red Planet?',options:['Venus','Mars','Jupiter','Neptune'],answer:1,explanation:'Mars looks reddish because of iron oxides.'},
    {id:'qe3',question:'What is the result of 7 multiplied by 8?',options:['48','54','56','64'],answer:2,explanation:'Seven times eight is 56.'},
    {id:'qe4',question:'Which ocean lies between Africa and Australia?',options:['Arctic Ocean','Atlantic Ocean','Indian Ocean','Southern Ocean'],answer:2,explanation:'The Indian Ocean lies between Africa and Australia.'}
  ]}
];
export function starterTemplatesFor(game){
  return STARTER_TEMPLATES.filter(item=>item.game===game);
}
export function findStarterTemplate(game,id){
  const item=STARTER_TEMPLATES.find(value=>value.id===id);
  if(!item)throw Error('This starter template was not found.');
  if(item.game!==game)throw Error('This starter template belongs to another game.');
  return {...item,questions:structuredClone(item.questions)};
}

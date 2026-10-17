import React, {useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {SurveyGame} from './games/survey/index.jsx';
import {QuickfireApp} from './games/quickfire/index.jsx';
import {GameHub} from './GameHub.jsx';
import {Dashboard} from './dashboard/Dashboard.jsx';
import {PlayfulDesignLab} from './design/PlayfulDesignLab.jsx';
import './styles.css';

/** Registry of playable modules; catalog-only planned entries have no component. */
const GAME_VIEWS={survey:SurveyGame,quickfire:QuickfireApp};
function App(){
  useEffect(()=>{
    if('serviceWorker' in navigator && import.meta.env.PROD){
      navigator.serviceWorker.register(new URL('sw.js',location.href)).catch(err=>console.warn('Offline registration unsuccessful',err));
    }
  },[]);
  const selected=new URLSearchParams(location.search).get('game');
  const View=GAME_VIEWS[selected];
  if(View)return <View/>;
  if(new URLSearchParams(location.search).get('page')==='design-lab')return <PlayfulDesignLab/>;
  return new URLSearchParams(location.search).get('page')==='dashboard'?<Dashboard/>:<GameHub/>;
}
createRoot(document.getElementById('root')).render(<App/>);

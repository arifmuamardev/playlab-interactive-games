/** Practice sessions have separate browser keys/channels from real games. */
export const REHEARSAL_KEYS={survey:'playlab-survey-rehearsal-v1',quickfire:'playlab-quickfire-rehearsal-v1'};
export const isRehearsal=()=>new URLSearchParams(location.search).get('mode')==='rehearsal';

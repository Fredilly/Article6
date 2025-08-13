export default {
  docs: { los: 20, mou: 35, fera: 45 }, // max 100
  meetingsMax: 60,                       // log-scaled to ~10 meetings
  recencyMax: 40,                        // decays 40->0 over 30 days
  momentumPerMeeting: 2,                 // per meeting in last 30d
  momentumCap: 20,
};

export const stateFacts: Record<string, string[]> = {
  abia: [
    "Did you know that Abia's oil and gas reserves contribute significantly to Nigeria's carbon emissions, but its limestone deposits could support carbon capture technologies?",
  ],
  adamawa: [
    "Did you know that Adamawa's vast savannas act as natural carbon sinks, absorbing CO2 through grasslands that support over 1.5 million people in agriculture?",
  ],
  "akwa-ibom": [
    "Did you know that Akwa Ibom's coastal mangroves store massive amounts of blue carbon, helping mitigate climate change while protecting against sea-level rise?",
  ],
  anambra: [
    "Did you know that Anambra's dense population of over 6 million faces increasing flood risks due to climate change, exacerbated by its riverine landscapes?",
  ],
  bauchi: [
    "Did you know that Bauchi's semi-arid climate makes it vulnerable to desertification, threatening the livelihoods of its 7 million residents reliant on farming?",
  ],
  bayelsa: [
    "Did you know that Bayelsa's oil fields are a hotspot for methane leaks, but its wetlands could be restored for carbon credits to combat environmental degradation?",
  ],
  benue: [
    "Did you know that Benue, known as Nigeria's \"Food Basket,\" has rich farmlands that sequester carbon, feeding over 5 million people amid rising drought threats?",
  ],
  borno: [
    "Did you know that Borno's shrinking Lake Chad due to climate change has displaced millions, highlighting the human cost of desertification in the Sahel region?",
  ],
  "cross-river": [
    "Did you know that Cross River hosts one of Nigeria's largest rainforests, a biodiversity hotspot that stores gigatons of carbon but faces deforestation pressures?",
  ],
  delta: [
    "Did you know that Delta's Niger Delta mangroves absorb CO2 equivalent to thousands of cars annually, yet oil spills have polluted ecosystems affecting 8 million locals?",
  ],
  ebonyi: [
    "Did you know that Ebonyi's lead mining contributes to environmental pollution, but its salt lakes could inspire sustainable practices in a warming climate?",
  ],
  edo: [
    "Did you know that Edo's tropical rainforests serve as vital carbon sinks, supporting biodiversity and the cultural heritage of its diverse ethnic groups?",
  ],
  ekiti: [
    "Did you know that Ekiti's hilly terrain and granite resources make it prone to erosion from heavy rains, impacting the farming communities of its 3 million people?",
  ],
  enugu: [
    "Did you know that Enugu's coal deposits have historically driven carbon emissions, but shifting to renewables could reduce its climate footprint significantly?",
  ],
  gombe: [
    "Did you know that Gombe's gemstone mining areas face land degradation, yet its savanna ecosystems help sequester carbon for its growing population?",
  ],
  imo: [
    "Did you know that Imo's oil and gas production adds to national emissions, but its palm oil plantations could be optimized for sustainable carbon-neutral biofuels?",
  ],
  jigawa: [
    "Did you know that Jigawa's arid climate leads to frequent droughts, affecting over 6 million people who depend on groundwater for survival?",
  ],
  kaduna: [
    "Did you know that Kaduna's diverse minerals like gold support livelihoods, but mining runoff worsens water scarcity in this climate-vulnerable northern state?",
  ],
  kano: [
    "Did you know that Kano, Nigeria's second-most populous state with over 15 million residents, faces urban heat islands amplified by climate change?",
  ],
  katsina: [
    "Did you know that Katsina's salt resources are threatened by desert encroachment, impacting traditional farming practices of its 8 million inhabitants?",
  ],
  kebbi: [
    "Did you know that Kebbi's gold mining boom could fund reforestation efforts to combat the state's high vulnerability to Sahelian droughts?",
  ],
  kogi: [
    "Did you know that Kogi's iron ore and coal resources contribute to industrial emissions, but its confluence of rivers makes it a key site for flood-related climate risks?",
  ],
  kwara: [
    "Did you know that Kwara's marble and gold deposits drive economic growth, yet increasing temperatures threaten the agricultural base for its 3 million people?",
  ],
  lagos: [
    "Did you know that Lagos, Africa's most populous city with over 20 million people, emits high urban carbon but leads in renewable energy initiatives like solar?",
  ],
  nasarawa: [
    "Did you know that Nasarawa's gemstones and barite are mined amid savanna landscapes that act as carbon buffers against central Nigeria's erratic rainfall?",
  ],
  niger: [
    "Did you know that Niger State, the largest by land area, has vast gold reserves but battles desertification that displaces nomadic herding communities?",
  ],
  ogun: [
    "Did you know that Ogun's phosphate and limestone support cement production with high CO2 output, yet its proximity to Lagos amplifies urban climate pressures?",
  ],
  ondo: [
    "Did you know that Ondo's bitumen reserves could be tapped for low-carbon roads, while its cocoa farms sequester CO2 for millions in the agricultural sector?",
  ],
  osun: [
    "Did you know that Osun's gold mining sites face environmental degradation from climate-driven erosion, affecting sacred forests tied to Yoruba culture?",
  ],
  oyo: [
    "Did you know that Oyo's kaolin and marble resources fuel industry, but its savanna climate exposes over 9 million people to heatwaves and water shortages?",
  ],
  plateau: [
    "Did you know that Plateau's highland climate provides a cool refuge in warming Nigeria, with tin mining lands potentially rehabilitated for carbon storage?",
  ],
  rivers: [
    "Did you know that Rivers State's oil industry is a major global carbon source, but its mangroves could offset emissions through blue carbon projects?",
  ],
  sokoto: [
    "Did you know that Sokoto's phosphate and gold support farming, yet extreme heat from climate change challenges the resilience of its 5 million residents?",
  ],
  taraba: [
    "Did you know that Taraba's gemstones are found in biodiverse mountains that serve as carbon sinks, protecting against floods for its ethnic diverse population?",
  ],
  yobe: [
    "Did you know that Yobe's gypsum resources are in a Sahel zone hit hard by drought, leading to food insecurity for over 3 million amid climate migration?",
  ],
  zamfara: [
    "Did you know that Zamfara's gold rush has caused lead poisoning crises, but community-led reforestation could build carbon resilience in this arid state?",
  ],
  fct: [
    "Did you know that Abuja's marble and gold resources surround a planned city of 3 million, where urban greening efforts aim to reduce its carbon footprint?",
  ],
};

export function getStateFacts(slug: string): string[] {
  return stateFacts[slug] || [];
}


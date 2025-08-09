import React from 'react';
import { useRouter } from 'next/router';
import nigeria from '@svg-maps/nigeria';

export interface NigeriaMapProps {
  active?: string[];
}

const EPITHETS: Record<string, string> = {
  abia: "God's Own State",
  adamawa: 'Land of Beauty',
  'akwa-ibom': 'Land of Promise',
  anambra: 'Light of the Nation',
  bauchi: 'Pearl of Tourism',
  benue: 'Food Basket of the Nation',
  borno: 'Home of Peace',
  bayelsa: 'Glory of All Lands',
  'cross-river': "The People's Paradise",
  delta: 'The Big Heart',
  ebonyi: 'Salt of the Nation',
  edo: 'Heartbeat of the Nation',
  ekiti: 'Fountain of Knowledge',
  enugu: 'Coal City State',
  fct: 'Centre of Unity',
  gombe: 'Jewel in the Savannah',
  imo: 'Eastern Heartland',
  jigawa: 'The New World',
  kaduna: 'Centre of Learning',
  kebbi: 'Land of Equity',
  kano: 'Centre of Commerce',
  kogi: 'The Confluence State',
  katsina: 'Home of Hospitality',
  kwara: 'State of Harmony',
  lagos: 'Centre of Excellence',
  nassarawa: 'Home of Solid Minerals',
  niger: 'The Power State',
  ogun: 'Gateway State',
  ondo: 'Sunshine State',
  osun: 'State of the Living Spring',
  oyo: 'Pacesetter State',
  plateau: 'Home of Peace and Tourism',
  rivers: 'Treasure Base of the Nation',
  sokoto: 'Seat of the Caliphate',
  taraba: "Nature's Gift to the Nation",
  yobe: 'Pride of the Sahel',
  zamfara: 'Farming is Our Pride',
};

const NigeriaMap: React.FC<NigeriaMapProps> = ({ active = [] }) => {
  const router = useRouter();
  const { viewBox, locations } = nigeria as unknown as {
    viewBox: string;
    locations: { id: string; name: string; path: string }[];
  };

  const [, , width, height] = viewBox.split(' ').map(Number);
  const scaleX = 1000 / width;
  const scaleY = 1000 / height;

  return (
    <svg
      viewBox="0 0 1000 1000"
      className="w-full h-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={`scale(${scaleX} ${scaleY})`}>
        {locations.map((loc) => (
          <path
            key={loc.id}
            d={loc.path}
            fill={active.includes(loc.id) ? '#16A34A' : '#E5E7EB'}
            className="cursor-pointer transition-colors duration-200 hover:fill-[#22C55E]"
            onClick={() => router.push(`/states/${loc.id}`)}
          >
            <title>
              {loc.name}
              {EPITHETS[loc.id] ? ` — ${EPITHETS[loc.id]}` : ''}
            </title>
          </path>
        ))}
      </g>
    </svg>
  );
};

export default NigeriaMap;

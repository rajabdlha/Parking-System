export const bresciaParking = [
  { nome: 'Randaccio',               posti: 153,  lat: 45.54457474, lng: 10.21333122 },
  { nome: 'Sant\'Eufemia',           posti: 394,  lat: 45.51190479, lng: 10.28022113 },
  { nome: 'Fossa Bagni',             posti: 516,  lat: 45.54423141, lng: 10.22429085 },
  { nome: 'Palagiustizia',           posti: 538,  lat: 45.53078461, lng: 10.22312164 },
  { nome: 'Ospedale Sud',            posti: 471,  lat: 45.55443954, lng: 10.23043919 },
  { nome: 'Casazza',                 posti: 157,  lat: 45.57577896, lng: 10.228508   },
  { nome: 'Crystal',                 posti: 359,  lat: 45.5243721,  lng: 10.21453571 },
  { nome: 'Ospedale Nord Esterno',   posti: 146,  lat: 45.56023407, lng: 10.23260593 },
  { nome: 'Ospedale Nord Interrato', posti: 1244, lat: 45.55975342, lng: 10.23159695 },
  { nome: 'Crystal Terrazzo',        posti: 60,   lat: 45.5243721,  lng: 10.21453476 },
  { nome: 'Camper',                  posti: 10,   lat: 45.51680384, lng: 10.23486182 },
  { nome: 'Stazione',                posti: 958,  lat: 45.53233337, lng: 10.2149086  },
  { nome: 'Vittoria',                posti: 460,  lat: 45.53781509, lng: 10.21893692 },
  { nome: 'Arnaldo',                 posti: 263,  lat: 45.53642273, lng: 10.23163986 },
  { nome: 'Autosilo1',               posti: 317,  lat: 45.53338563, lng: 10.22214132 },
  { nome: 'Freccia Rossa',           posti: 2218, lat: 45.5359047,  lng: 10.20981331 },
  { nome: 'Piazza Mercato',          posti: 190,  lat: 45.53754634, lng: 10.21797139 },
  { nome: 'Benedetto Croce',         posti: 72,   lat: 45.53455734, lng: 10.21966362 },
  { nome: 'San Domenico',            posti: 72,   lat: 45.53532028, lng: 10.21919155 },
  { nome: 'Prealpino',               posti: 878,  lat: 45.58044282, lng: 10.22785373 },
]

// Cap a 40 posti per non sovraccaricare l'UI
export function generateSpots(parking) {
  const totale    = parking.posti
  const nAuto     = Math.floor(totale * 0.70)
  const nMoto     = Math.floor(totale * 0.20)
  const nDisabili = totale - nAuto - nMoto

  const spots = []
  let id = 1

  for (let i = 0; i < nAuto; i++)
    spots.push({ id: id++, type: 'auto',     occupied: false, label: `A${id - 1}` })
  for (let i = 0; i < nMoto; i++)
    spots.push({ id: id++, type: 'moto',     occupied: false, label: `M${id - 1}` })
  for (let i = 0; i < nDisabili; i++)
    spots.push({ id: id++, type: 'disabile', occupied: false, label: `D${id - 1}` })

  return spots
}


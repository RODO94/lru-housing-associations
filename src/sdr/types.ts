export const SDR_FILE_SUFFIXES = [
  "File 01 - ELI.csv",
  "File 02 - Group Information.csv",
  "File 03 - LCR Stock.csv",
  "File 04 - Stock by LA.csv",
  "File 05 - GN rents non except.csv",
  "File 06 - SHHOP rents non exc.csv",
  "File 07 - GN rents except.csv",
  "File 08 - SHHOP rents except.csv",
  "File 09 - GN rents combined.csv",
  "File 0A - Data Dictionary.csv",
  "File 0B - Table Coverage.csv",
  "File 10 - SHHOP rents comb.csv",
  "File 11 - Small PRP rents vac.csv",
  "File 12 - AR GN rents.csv",
  "File 13 - AR SHHOP rents.csv",
  "File 14 - LCHO.csv",
  "File 15 - Leased and Other.csv",
  "File 16 - Stock Balance Sheet.csv",
  "File 17 - AR Stock Details.csv",
  "File 18 - Stock Usage.csv",
] as const;

/** The 33 London local authorities: 32 boroughs plus the City of London. */
export const LA_CODES = [
  "E09000001", // City of London
  "E09000002", // Barking and Dagenham
  "E09000003", // Barnet
  "E09000004", // Bexley
  "E09000005", // Brent
  "E09000006", // Bromley
  "E09000007", // Camden
  "E09000008", // Croydon
  "E09000009", // Ealing
  "E09000010", // Enfield
  "E09000011", // Greenwich
  "E09000012", // Hackney
  "E09000013", // Hammersmith and Fulham
  "E09000014", // Haringey
  "E09000015", // Harrow
  "E09000016", // Havering
  "E09000017", // Hillingdon
  "E09000018", // Hounslow
  "E09000019", // Islington
  "E09000020", // Kensington and Chelsea
  "E09000021", // Kingston upon Thames
  "E09000022", // Lambeth
  "E09000023", // Lewisham
  "E09000024", // Merton
  "E09000025", // Newham
  "E09000026", // Redbridge
  "E09000027", // Richmond upon Thames
  "E09000028", // Southwark
  "E09000029", // Sutton
  "E09000030", // Tower Hamlets
  "E09000031", // Waltham Forest
  "E09000032", // Wandsworth
  "E09000033", // Westminster
];

export type SdrFileSuffix = (typeof SDR_FILE_SUFFIXES)[number];
export type SdrFilePath = `data/sdr/SDR_Data_Release_2025/${SdrFileSuffix}`;

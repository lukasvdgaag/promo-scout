import {SiteDefinition} from '../type/types';
import {staatsloterij} from './staatsloterij';
import {radio10, radio538, skyradio, talpaNetworkTv} from "./talpa-sites";
import {cocaCola} from "./coca-cola";
import {pepsiCo} from "./pepsico";

export const sites: SiteDefinition[] = [
    staatsloterij,
    talpaNetworkTv,
    skyradio,
    radio10,
    radio538,
    cocaCola,
    pepsiCo,
];

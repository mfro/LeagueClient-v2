import * as Kappa      from './../kappa';
const service = '/summoner';

var events = new EventModule();
export const me = events.create<any>();

Kappa.subscribe(service + '/me', m => {
    events.dispatch(me, m);
})

export function get(name: string) {
    return Kappa.invoke<Domain.Summoner.SummonerSummary>(service + '/get', [name]);
}

export function details(account: number) {
    return Kappa.invoke<Domain.Summoner.SummonerDetails>(service + '/details', [account]);
}

export function kudos(id: number) {
    return Kappa.invoke<Domain.Summoner.SummonerKudos>(service + '/kudos', [id]);
}

export function icon(ids: number[]) {
    return Kappa.invoke<{ [id: number]: number }>(service + '/icon', [ids]);
}

export function store() {
    return Kappa.invoke<string>(service + '/store', []);
}

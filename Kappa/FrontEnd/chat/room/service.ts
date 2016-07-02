import * as Kappa from './../../kappa'

const service = '/chat/rooms';
const events = new EventModule();

Kappa.subscribe(service + '/memberJoin', member => {
    events.dispatch(join, member);
});

Kappa.subscribe(service + '/memberLeave', member => {
    events.dispatch(leave, member);
});

Kappa.subscribe(service + '/message', msg => {
    events.dispatch(message, msg);
});

export const join = events.create<MucFriend>();
export const leave = events.create<MucFriend>();
export const message = events.create<MucMessage>();

export function send(room: string, msg: string) {
    return Kappa.invoke(service + '/message', [room, msg]);
}
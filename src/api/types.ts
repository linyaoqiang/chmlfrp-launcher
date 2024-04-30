export interface UserInfo {
  code: number;
  message: string;
  userid: number;
  username: string;
  userimg: string;
  email: string;
  qq: string;
  usergroup: string;
  bandwidth: number;
  tunnel: number;
  tunnelstate: number;
  token: string;
  realname: string;
  integral: number;
  term: string;
  background_img: string;
  Element_transparency: number;
  error: string;
}

export interface TunnelUpdate {
  tunnelid: string;
  usertoken: string;
  userid: number;
  localip: string;
  name: string;
  node: string;
  type: string;
  nport: string;
  dorp: string;
  ap: string;
  encryption: string;
  compression: string;
}

export interface TunnelCreate {
  token: string;
  userid: number;
  localip: string;
  name: string;
  node: string;
  type: string;
  nport: string;
  dorp: number;
  ap: string;
  domainNameLabel: string;
  choose: string;
  encryption: string;
  compression: string;
}

export interface NodeInfo {
  id: number;
  ip: string;
  nodetoken: string;
  port: number;
  rport: string;
  name: string;
  area: string;
  state: string;
  nodegroup: string;
  apitoken: string;
  china: string;
  web: string;
  http_port: number;
  https_port: number;
  fangyu: string;
  notes: string;
  udp: string;
}
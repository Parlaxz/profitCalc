export interface UTM {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  valid: boolean;
}

export interface Event {
  // Replace with actual properties of the event object
}

export interface User {
  UTM: UTM;
  events: Event[];
  id: string;
  ip: string;
  timeCreated: string;
  timeUpdated: string;
}

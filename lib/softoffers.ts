const BASE_URL = "https://offers-softoffers.affise.com/postback";

export async function sendSoftoffersPostback(clickId: string, goal: string) {
  if (!clickId) return;

  const url = new URL(BASE_URL);
  url.searchParams.set("clickid", clickId);
  url.searchParams.set("goal", goal);

  try {
    const res = await fetch(url.toString());
    if (res.ok) {
      console.log(`Softoffers ${goal} postback sent for ${clickId}`);
    } else {
      console.error(`Softoffers ${goal} postback failed`, res.status);
    }
  } catch (error) {
    console.error(`Softoffers ${goal} postback network error`, error);
  }
}

export const sendDepositPostback = (clickId: string) =>
  sendSoftoffersPostback(clickId, "dep");

export const sendRegistrationPostback = (clickId: string) =>
  sendSoftoffersPostback(clickId, "reg");

export const sendClickPostback = (clickId: string) =>
  sendSoftoffersPostback(clickId, "click");
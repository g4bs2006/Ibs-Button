const TOKEN = 'Bearer pn_22zvaOtn9H6mmwNKktsuKd91F8UDdLnuu085N5bw'
const PANEL_ID = 'fd4df083-7422-4171-9ee2-1c098e799798'

async function test() {
  const contactId = '41ee22bb-59ae-4db8-80a9-10ab312d4801';
  const qs = new URLSearchParams({ PanelId: PANEL_ID, ContactId: contactId, PageSize: 1, PageNumber: 1 })
  const res = await fetch(`https://api.wts.chat/crm/v1/panel/card?${qs}`, {
    headers: { Authorization: TOKEN }
  })
  const json = await res.json()
  console.log("Found by ContactId:", json.items && json.items.length)
}

test()

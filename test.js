const TOKEN = 'Bearer pn_22zvaOtn9H6mmwNKktsuKd91F8UDdLnuu085N5bw'
const PANEL_ID = 'fd4df083-7422-4171-9ee2-1c098e799798'

async function test() {
  const qs = new URLSearchParams({ PanelId: PANEL_ID, PageSize: 5, PageNumber: 1 })
  const res = await fetch(`https://api.wts.chat/crm/v1/panel/card?${qs}`, {
    headers: { Authorization: TOKEN }
  })
  const json = await res.json()
  if (json.items && json.items.length > 0) {
    console.log(JSON.stringify(json.items[0], null, 2))
  } else {
    console.log("No items found")
  }
}

test()

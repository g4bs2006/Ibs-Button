const TOKEN = 'Bearer pn_22zvaOtn9H6mmwNKktsuKd91F8UDdLnuu085N5bw'
const PANEL_ID = 'fd4df083-7422-4171-9ee2-1c098e799798'

async function test() {
  const cid = 'acc44dc6-bfe6-4f8d-add7-e50a9b82c124'
  
  // 1. Get Contact
  const contactRes = await fetch(`https://api.wts.chat/core/v1/contact/${cid}`, {
    headers: { Authorization: TOKEN }
  })
  const contactJson = await contactRes.json().catch(() => null)
  console.log("Contact Name:", contactJson?.name)

  // 2. Find Card By ContactId
  let qs = new URLSearchParams({ PanelId: PANEL_ID, ContactId: cid, PageSize: 1, PageNumber: 1 })
  const cardRes = await fetch(`https://api.wts.chat/crm/v1/panel/card?${qs}`, {
    headers: { Authorization: TOKEN }
  })
  const cardJson = await cardRes.json().catch(() => null)
  console.log("Cards found by ContactId:", cardJson?.items?.length || 0)

  // 3. Fallback: Find Card by Name
  if (contactJson?.name) {
    qs = new URLSearchParams({ PanelId: PANEL_ID, TextFilter: contactJson.name, PageSize: 1, PageNumber: 1 })
    const fbRes = await fetch(`https://api.wts.chat/crm/v1/panel/card?${qs}`, {
      headers: { Authorization: TOKEN }
    })
    const fbJson = await fbRes.json().catch(() => null)
    console.log("Cards found by TextFilter (name):", fbJson?.items?.length || 0)
    if (fbJson?.items?.length > 0) {
      console.log("Card found (TextFilter) ID:", fbJson.items[0].id)
    }
  }
}

test()

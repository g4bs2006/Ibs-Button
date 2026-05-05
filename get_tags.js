const TOKEN = 'Bearer pn_22zvaOtn9H6mmwNKktsuKd91F8UDdLnuu085N5bw'

async function listTags() {
  const res = await fetch(`https://api.wts.chat/core/v1/tag`, {
    headers: { Authorization: TOKEN }
  })
  
  if (!res.ok) {
    console.error("Erro ao buscar etiquetas", res.status, await res.text())
    return
  }
  
  const tags = await res.json()
  console.log("=== LISTA DE ETIQUETAS ===")
  tags.forEach(tag => {
    console.log(`Nome: ${tag.name} | ID: ${tag.id}`)
  })
}

listTags()

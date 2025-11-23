// generate-supracorp-full.js

const fs = require("fs");
const path = require("path");

const basicPath = path.join(__dirname, "data/products-supracorp.json");
const fullPath = path.join(__dirname, "data/products-supracorp-full.json");

function gerarDescricaoCompleta(produto, marca) {
  const nome = produto.toLowerCase();

  return {
    Produto: produto,
    Marca: marca,
    Categoria: nome.includes("colageno") ? "Colágeno" : nome.includes("vitamina") ? "Vitamina" : "Suplemento",
    Benefícios: `O ${produto} da ${marca} auxilia na saúde geral com foco em ${nome.includes("d3") ? "ossos e imunidade" : nome.includes("unhas") ? "pele, cabelo e unhas" : "bem-estar e vitalidade"}.`,
    Aplicação: `Uso indicado para quem busca ${nome.includes("energia") ? "mais energia" : nome.includes("sono") ? "melhora no sono" : "suplementação equilibrada"}.`,
    Combina: nome.includes("omega") ? "Vitamina D, Magnésio" : nome.includes("cabelo") ? "Biotina, Colágeno" : "Polivitamínicos, Vitamina C",
    "Dicas de vendas": `Indique o ${produto} como parte de uma rotina de cuidados com a saúde. Reforce a confiança na marca ${marca}.`,
    Diferenciais: nome.includes("kit") ? "Kit completo com excelente custo-benefício" : "Produto de alta absorção e qualidade farmacêutica",
    Contraindicações: "Gestantes, lactantes e menores de 18 anos devem consultar um profissional de saúde.",
    Apresentação: "Frasco com 60 cápsulas" + (nome.includes("g") ? ", ou em pó de 300g" : ""),
    "Público-alvo": nome.includes("mulher") ? "Mulheres adultas" : nome.includes("kids") ? "Crianças a partir de 4 anos" : "Público geral adulto",
    "Posologia sugerida": "1 a 2 cápsulas ao dia, ou conforme orientação profissional",
    "Validade média": "24 meses a partir da data de fabricação",
    "Venda cruzada ideal": nome.includes("cabelo") ? "Biotina e Colágeno Hidrolisado" : nome.includes("sono") ? "Melatonina e L-Triptofano" : "Vitamina C e Polivitamínico"
  };
}

function gerarJSONCompleto() {
  const listaBasica = JSON.parse(fs.readFileSync(basicPath, "utf-8"));
  const jsonCompleto = listaBasica.map(p => gerarDescricaoCompleta(p.Produto, p.Marca));

  fs.writeFileSync(fullPath, JSON.stringify(jsonCompleto, null, 2), "utf-8");
  console.log("✅ Arquivo 'products-supracorp-full.json' gerado com sucesso!");
}

gerarJSONCompleto();

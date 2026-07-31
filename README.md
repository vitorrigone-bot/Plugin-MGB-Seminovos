# MGB Harley — Plugin de Preenchimento de Template

## Como instalar

1. Abra o Figma Desktop
2. Vá em **Plugins → Development → Import plugin from manifest...**
3. Selecione o arquivo `manifest.json` desta pasta
4. O plugin aparece em **Plugins → Development → MGB Harley — Preenchedor de Template**

---

## Nomenclatura das camadas no Figma

Nomeie as camadas com o prefixo `$` exatamente como abaixo:

### Textos
| Camada no Figma   | Campo no plugin       |
|-------------------|-----------------------|
| `$nome-moto`      | Nome da Moto          |
| `$ano-mod`        | Ano / Modelo          |
| `$km`             | Kilometragem          |
| `$info`           | Informações Adicionais|
| `$preco-de`       | Preço De              |
| `$preco-por`      | Preço Por             |

### Imagens (Rectangle ou Frame com fill)
| Camada no Figma    | Campo no plugin     |
|--------------------|---------------------|
| `$foto-principal`  | Foto Principal      |
| `$foto-1`          | Foto Secundária 1   |
| `$foto-2`          | Foto Secundária 2   |
| `$foto-3`          | Foto Secundária 3   |

> **Dica:** A camada pode estar em qualquer nível de aninhamento — o plugin varre a página inteira.

### Aba Webmotors (capa)

Preenchimento simples: 2 condições + foto da moto.

| Camada no Figma | Campo no plugin |
|-----------------|-----------------|
| `$condição1`    | Condição 1 (ex: taxa) |
| `$condição2`    | Condição 2 (ex: garantia) |
| `$img`          | Foto da moto |

> **Atenção:** os nomes `$condição1` e `$condição2` usam acento e cedilha — nomeie as camadas no Figma exatamente assim.

> **Estrutura da camada:** o texto `$condição1`/`$condição2` deve estar **dentro do seu próprio frame/caixa** (a "pill" colorida). Quando o campo fica vazio, o plugin oculta esse frame pai inteiro — não só o texto — então a caixa colorida some junto. Se o texto estiver solto (sem frame próprio como pai), o plugin oculta o próprio texto.

---

## Como usar

1. Monte o layout no Figma com as camadas nomeadas acima
2. Abra o plugin
3. Preencha os campos desejados (pode preencher só alguns)
4. Clique em **Preencher Template**
5. Use o botão **Verificar camadas** para conferir se o Figma está reconhecendo as camadas

---

## Dicas

- Campos vazios são ignorados (não apaga o que já está no template)
- Imagens são inseridas como fill tipo `FILL` (cobre o retângulo inteiro)
- Para duplicar o frame e preencher uma nova moto, duplique o frame antes de abrir o plugin

---

## Produção completa (planilha única → todos os layouts)

O plugin tem uma terceira aba, **🚀 Produção completa**, pra quando você quer gerar tudo de uma vez a partir de **uma única planilha** com os dados dos veículos (1 linha = 1 veículo).

A partir dessa planilha, o plugin monta automaticamente:

- **Seminovos**: 1 card por veículo (linha)
- **Webmotors**: 1 capa por veículo, usando a **Foto Principal** da planilha como `$img` e as colunas opcionais **Condição 1** / **Condição 2**
- **3 Veículos**: se houver **3 ou mais veículos** na planilha, monta 1 card de trio a cada 3 linhas (mesma lógica de agrupamento do modo massa — último card com slot vazio fica oculto)

### Como usar

1. Monte no Figma os cards-modelo dos **três layouts** (Seminovos, 3 Veículos e Webmotors) com as camadas `$...` nomeadas — podem estar na mesma página ou na seleção atual.
2. Na aba **Produção completa**, suba a planilha (mesmas colunas do layout Seminovos, ver tabela abaixo, mais **Condição 1** / **Condição 2** para a capa) e depois todas as imagens.
3. Clique em **Produzir tudo**. O plugin detecta os cards de cada layout separadamente e preenche cada um, duplicando página/frame automaticamente quando faltar espaço (mesmo comportamento do modo massa).
4. O resultado mostra o status de cada layout (Seminovos / 3 Veículos / Webmotors) com avisos próprios. Se houver menos de 3 veículos, o layout 3 Veículos é pulado (aparece um aviso, não é erro).

### Colunas da planilha (Produção completa)

Mesmas colunas do layout **Seminovos** (veja tabela abaixo) mais:

| Coluna (aceita)        | Camada usada na capa Webmotors |
|------------------------|---------------------------------|
| Condição 1 / Cond 1    | `$condição1`                    |
| Condição 2 / Cond 2    | `$condição2`                    |

A foto usada na capa Webmotors é a mesma da coluna **Foto Principal**.

---

## Produção em massa (via planilha)

O plugin tem duas abas no topo: **✏️ Inserir manual** (tudo acima) e **📊 Produção em massa**.

No modo massa, cada **linha da planilha vira 1 card** no Figma (exceto no layout **3 Veículos**, onde cada linha é 1 moto — veja abaixo). Funciona com três layouts (escolha no seletor **Seminovos / 3 Veículos / Webmotors**).

**A mesma planilha (formato Seminovos) funciona nos três layouts e também na Produção completa** — inclusive a coluna **Foto Principal** já é aceita como imagem da capa Webmotors (`$img`), então o vendedor não precisa manter planilhas diferentes por layout.

### Como funciona

1. Monte no Figma **um card modelo** com as camadas nomeadas (as mesmas `$...` de cima). O card pode ser um frame solto ou vários cards num grid dentro de uma página.
2. Na aba **Produção em massa**, escolha o layout, suba a **planilha** e depois **todas as imagens** de uma vez.
3. Clique em **Produzir em massa**. O plugin detecta os cards, preenche na ordem de leitura e, se faltarem cards para todas as linhas, **duplica a página/frame automaticamente** (empilhando abaixo). Cards que sobram são ocultados; páginas extras de rodadas anteriores são apagadas.

### Colunas da planilha

O cabeçalho é lido **sem diferenciar acento/maiúscula** e aceita apelidos.

**Seminovos** (1 veículo, 4 fotos):

| Coluna (aceita)                     | Camada           |
|-------------------------------------|------------------|
| Veículo / Modelo                    | `$veiculo`       |
| Ano/Mod / Ano                       | `$ano-mod`       |
| Km                                  | `$km`            |
| Info / Obs                          | `$info`          |
| Preço De / De                       | `$preco-de`      |
| Preço Por / Por                     | `$preco-por`     |
| Foto Principal / Foto               | `$foto-principal`|
| Foto 1                              | `$foto-1`        |
| Foto 2                              | `$foto-2`        |
| Foto 3                              | `$foto-3`        |

**Webmotors** (capa, 1 foto):

| Coluna (aceita)        | Camada        |
|------------------------|---------------|
| Condição 1 / Cond 1    | `$condição1`  |
| Condição 2 / Cond 2    | `$condição2`  |
| Img / Imagem / Foto / Foto Principal | `$img` |

**3 Veículos** (trio, 1 foto por moto) — funciona diferente das outras: **cada linha é 1 moto**, não 1 card.

| Coluna (aceita)                     | Camada (sem sufixo — veja abaixo) |
|--------------------------------------|-----------------------------------|
| Veículo / Modelo                    | `$veiculo`       |
| Ano/Mod / Ano                       | `$ano-mod`       |
| Km                                  | `$km`            |
| Info / Obs                          | `$info`          |
| Preço De / De                       | `$preco-de`      |
| Preço Por / Por                     | `$preco-por`     |
| Foto Principal / Foto               | `$foto-principal`|

O plugin junta **3 linhas em 1 card**, aplicando o sufixo `-1`/`-2`/`-3` nas camadas (ex.: `$veiculo-1`, `$veiculo-2`, `$veiculo-3`). Se o total de motos não for múltiplo de 3, o **último card fica com slot(s) vazio(s)** — o plugin oculta automaticamente o sub-frame `Moto 01`/`Moto 02`/`Moto 03` correspondente (mesma convenção de nomes usada no modo manual).

### Imagens

Nas colunas de foto, coloque o **nome do arquivo** (ex.: `civic-2024.jpg`). Selecione esses arquivos no passo 2 — o casamento é pelo nome (sem diferenciar maiúscula). Coluna de foto vazia oculta a camada de imagem daquele card.

### Automáticos (só no layout Seminovos, modo massa)

Para deixar a planilha mais limpa, dois campos recebem texto fixo sozinhos:

- **Preço De** → escreva só o número (ex.: `62.000`) e o card mostra `DE R$ 62.000`.
- **Km** → escreva só o número (ex.: `5.200`) e o card mostra `5.200 km`.

Se você digitar o valor completo (`R$ 62.000` ou `5.200 km`), ele **não duplica**. Para mudar o texto (`DE R$ ` / ` km`), edite as constantes `MASS_PRECO_DE_PREFIXO` e `MASS_KM_SUFIXO` no topo do bloco de massa em `ui.html`.

- **Preço Por** → sai **só o número** (ex.: `58.000`), porque o `R$` já está fixo no layout. Se você digitar `R$ 58.000` por engano, o `R$` é removido pra não duplicar.

### Observações

- Campo de texto vazio **oculta** aquela camada no card (ex.: sem `$preco-de`, o "De" some).
- O modo massa cobre os três layouts: **Seminovos** (single, 4 fotos), **3 Veículos** (trio, 1 foto cada) e a **capa Webmotors**.
- A detecção usa a seleção atual; se nada estiver selecionado, varre a página inteira. Use **Detectar cards** para conferir a contagem antes de produzir.

// MGB Seminovos (1 ou 3 veículos)
// Camadas identificadas pelo prefixo "$" no nome

figma.showUI(__html__, { width: 420, height: 720, title: "MGB Seminovos" });

// ─── Helpers ───────────────────────────────────────────────────────────────

function findNodesByPrefix(root, prefix) {
  var results = [];
  function walk(node) {
    if (node.name && node.name.startsWith(prefix)) results.push(node);
    if ("children" in node) node.children.forEach(walk);
  }
  walk(root);
  return results;
}

function getTargetNode(name) {
  var found = findNodesByPrefix(figma.currentPage, name);
  return found.length > 0 ? found[0] : null;
}

// Detecta o modo do frame selecionado: "single" ou "triple"
function detectMode() {
  var sel = figma.currentPage.selection;
  if (sel.length > 0) {
    var frame = sel[0];
    // Busca dentro do frame selecionado
    var hasTriple = findNodesByPrefix(frame, "$veiculo-1").length > 0;
    if (hasTriple) return "triple";
    var hasSingle = findNodesByPrefix(frame, "$veiculo").length > 0;
    if (hasSingle) return "single";
  }
  // Fallback: varre a página inteira
  if (findNodesByPrefix(figma.currentPage, "$veiculo-1").length > 0) return "triple";
  if (findNodesByPrefix(figma.currentPage, "$veiculo").length > 0) return "single";
  return "single";
}

// ─── Preencher texto ───────────────────────────────────────────────────────

async function fillText(layerName, value) {
  var node = getTargetNode(layerName);
  if (!node) return { ok: false, reason: "camada \"" + layerName + "\" não encontrada" };
  if (node.type !== "TEXT") return { ok: false, reason: "\"" + layerName + "\" não é texto" };

  var finalValue = (!value || value.trim() === "") ? " " : value;

  try {
    await figma.loadFontAsync(node.fontName);
    node.characters = finalValue;
    return { ok: true };
  } catch (e) {
    try {
      var fonts = new Set();
      for (var i = 0; i < node.characters.length; i++) {
        fonts.add(JSON.stringify(node.getRangeFontName(i, i + 1)));
      }
      var fontArr = [];
      fonts.forEach(function(f) { fontArr.push(figma.loadFontAsync(JSON.parse(f))); });
      await Promise.all(fontArr);
      node.characters = finalValue;
      return { ok: true };
    } catch (e2) {
      return { ok: false, reason: e2.message };
    }
  }
}

// ─── Preencher info (com controle de visibilidade) ──────────────────

async function fillInfo(layerName, value) {
  var node = getTargetNode(layerName);
  if (!node) return { ok: false, reason: 'camada "' + layerName + '" não encontrada' };
  if (node.type !== "TEXT") return { ok: false, reason: '"' + layerName + '" não é texto' };

  var isEmpty = !value || value.trim() === "";
  var finalValue = isEmpty ? "Informações Adicionais" : value;

  try {
    await figma.loadFontAsync(node.fontName);
    node.characters = finalValue;
  } catch (e) {
    try {
      var fonts = new Set();
      for (var i = 0; i < node.characters.length; i++) {
        fonts.add(JSON.stringify(node.getRangeFontName(i, i + 1)));
      }
      var fontArr = [];
      fonts.forEach(function(f) { fontArr.push(figma.loadFontAsync(JSON.parse(f))); });
      await Promise.all(fontArr);
      node.characters = finalValue;
    } catch (e2) {
      return { ok: false, reason: e2.message };
    }
  }

  node.visible = !isEmpty;
  return { ok: true };
}

// ─── Preencher imagem ──────────────────────────────────────────────────────

function resolveImageTarget(node) {
  var shapeTypes = ["RECTANGLE", "ELLIPSE", "VECTOR", "POLYGON", "STAR"];
  if (shapeTypes.indexOf(node.type) !== -1) return node;

  if ("fills" in node) {
    try {
      var test = node.fills;
      if (Array.isArray(test) || test === figma.mixed) return node;
    } catch (e) {}
  }

  if ("children" in node) {
    for (var i = 0; i < node.children.length; i++) {
      var child = node.children[i];
      if (child.type === "RECTANGLE" && "fills" in child) return child;
    }
  }

  return null;
}

async function applyImageFill(target, bytes) {
  var image = figma.createImage(bytes);
  var newFill = { type: "IMAGE", imageHash: image.hash, scaleMode: "FILL", opacity: 1, visible: true, blendMode: "NORMAL" };

  var currentFills = [];
  try {
    var raw = target.fills;
    if (raw !== figma.mixed && Array.isArray(raw)) {
      currentFills = raw.map(function(f) { return Object.assign({}, f); });
    }
  } catch (e) { currentFills = []; }

  var existingIdx = -1;
  for (var i = 0; i < currentFills.length; i++) {
    if (currentFills[i].type === "IMAGE") { existingIdx = i; break; }
  }
  if (existingIdx >= 0) currentFills[existingIdx] = newFill;
  else currentFills = [newFill].concat(currentFills);

  target.fills = currentFills;
}

async function fillImage(layerName, base64Data) {
  if (!base64Data) return { ok: false, reason: "sem dados de imagem" };
  var node = getTargetNode(layerName);
  if (!node) return { ok: false, reason: "camada \"" + layerName + "\" não encontrada" };
  var target = resolveImageTarget(node);
  if (!target) return { ok: false, reason: "\"" + layerName + "\" sem alvo válido" };

  try {
    var binary = atob(base64Data);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    await applyImageFill(target, bytes);
    return { ok: true };
  } catch (e) {
    if (target !== node && "fills" in node) {
      try {
        var binary2 = atob(base64Data);
        var bytes2 = new Uint8Array(binary2.length);
        for (var j = 0; j < binary2.length; j++) bytes2[j] = binary2.charCodeAt(j);
        await applyImageFill(node, bytes2);
        return { ok: true };
      } catch (e2) { return { ok: false, reason: e2.message }; }
    }
    return { ok: false, reason: e.message };
  }
}

// ─── Visibilidade de slot ─────────────────────────────────────────────────

function setSlotVisibility(slotName, visible) {
  var node = null;
  // Busca pelo nome exato na página
  for (var i = 0; i < figma.currentPage.children.length; i++) {
    var child = figma.currentPage.children[i];
    if (child.name === slotName) { node = child; break; }
  }
  // Se não achou no topo, busca dentro de frames filhos (caso esteja agrupado)
  if (!node) {
    var all = figma.currentPage.findAll(function(n) { return n.name === slotName; });
    if (all.length > 0) node = all[0];
  }
  if (node) {
    node.visible = visible;
    return { ok: true };
  }
  return { ok: false, reason: 'Frame "' + slotName + '" não encontrado' };
}

// ─── Handler de mensagens ──────────────────────────────────────────────────

// ═══════════════════════ PRODUÇÃO EM MASSA ═══════════════════════
// Reaproveita resolveImageTarget() e applyImageFill() definidos acima.

function massSelectionOrPage() {
  return figma.currentPage.selection.length > 0 ? figma.currentPage.selection : [figma.currentPage];
}

function massHasAll(node, required) {
  if (!("findOne" in node)) return false;
  for (var i = 0; i < required.length; i++) {
    var nm = required[i];
    if (node.name === nm) continue;
    var found = node.findOne(function(n) { return n.name === nm; });
    if (!found) return false;
  }
  return true;
}

function massResolveRoots(node, required) {
  if (!("children" in node)) return [];
  var matched = node.children.filter(function(c) { return massHasAll(c, required); });
  if (matched.length === 0) return [];
  var result = [];
  for (var i = 0; i < matched.length; i++) {
    var deeper = massResolveRoots(matched[i], required);
    if (deeper.length > 0) result = result.concat(deeper);
    else result.push(matched[i]);
  }
  return result;
}

function massGetRoots(nodes, required) {
  var roots = [];
  for (var i = 0; i < nodes.length; i++) {
    var deeper = massResolveRoots(nodes[i], required);
    if (deeper.length > 0) roots = roots.concat(deeper);
    else if (massHasAll(nodes[i], required)) roots.push(nodes[i]);
  }
  return roots;
}

function massSortReading(roots) {
  return roots.slice().sort(function(a, b) {
    var dy = a.absoluteTransform[1][2] - b.absoluteTransform[1][2];
    if (Math.abs(dy) > 10) return dy;
    return a.absoluteTransform[0][2] - b.absoluteTransform[0][2];
  });
}

function massTopAncestor(node) {
  var cur = node;
  while (cur.parent && cur.parent.type !== "PAGE") cur = cur.parent;
  return cur;
}

function massGroupByPage(cellRoots) {
  var groups = [];
  function find(p) { for (var i = 0; i < groups.length; i++) if (groups[i].parent === p) return groups[i]; return null; }
  for (var i = 0; i < cellRoots.length; i++) {
    var root = massTopAncestor(cellRoots[i]);
    var g = find(root);
    if (!g) { g = { parent: root, cells: [] }; groups.push(g); }
    g.cells.push(cellRoots[i]);
  }
  groups.forEach(function(g) { g.cells = massSortReading(g.cells); });
  groups.sort(function(a, b) {
    var dy = (a.parent.y || 0) - (b.parent.y || 0);
    if (Math.abs(dy) > 10) return dy;
    return (a.parent.x || 0) - (b.parent.x || 0);
  });
  return groups;
}

function massPageName(base, n) {
  var stripped = String(base || "Página").replace(/\d+\s*$/, "").trim();
  return stripped + " " + (n < 10 ? "0" + n : "" + n);
}

function massEnsurePages(groups, totalRows, warnings, required) {
  if (groups.length === 0) return groups;
  var capacity = 0;
  groups.forEach(function(g) { capacity += g.cells.length; });
  if (capacity >= totalRows) return groups;
  var tpl = groups[groups.length - 1];
  var perPage = tpl.cells.length;
  if (perPage === 0) { warnings.push("Não consegui calcular quantos cards cabem por página para duplicar automaticamente."); return groups; }
  var pagesNeeded = Math.ceil(totalRows / perPage);
  var toAdd = pagesNeeded - groups.length;
  if (toAdd <= 0) return groups;
  var gapY = 60;
  if (groups.length >= 2) {
    var prev = groups[groups.length - 2].parent, curr = groups[groups.length - 1].parent;
    var computed = curr.y - (prev.y + prev.height);
    if (isFinite(computed) && computed >= 0) gapY = computed;
  }
  var last = tpl.parent;
  var base = groups[0].parent.name;
  for (var i = 0; i < toAdd; i++) {
    var clone = last.clone();
    clone.x = last.x;
    clone.y = last.y + last.height + gapY;
    clone.name = massPageName(base, groups.length + 1);
    var cc = massResolveRoots(clone, required);
    if (cc.length === 0 && massHasAll(clone, required)) cc = [clone];
    groups.push({ parent: clone, cells: massSortReading(cc) });
    last = clone;
  }
  warnings.unshift("Criei " + toAdd + " página(s) extra(s) automaticamente pra caber todas as linhas.");
  return groups;
}

function massTrimPages(groups, totalRows, warnings) {
  if (groups.length <= 1) return groups;
  var perPage = groups[0].cells.length || 1;
  var pagesNeeded = Math.max(1, Math.ceil(totalRows / perPage));
  if (groups.length <= pagesNeeded) return groups;
  var removed = 0;
  while (groups.length > pagesNeeded && groups.length > 1) {
    var cand = groups[groups.length - 1];
    cand.parent.remove();
    groups.pop();
    removed++;
  }
  if (removed > 0) warnings.unshift(removed + " página(s) extra(s) de rodadas anteriores foram apagadas.");
  return groups;
}

async function massLoadFonts(node) {
  try { await figma.loadFontAsync(node.fontName); return; }
  catch (e) {}
  var fonts = new Set();
  for (var i = 0; i < node.characters.length; i++) fonts.add(JSON.stringify(node.getRangeFontName(i, i + 1)));
  var arr = [];
  fonts.forEach(function(f) { arr.push(figma.loadFontAsync(JSON.parse(f))); });
  await Promise.all(arr);
}

async function massSetText(node, value) {
  var isEmpty = value == null || String(value).trim() === "";
  if (isEmpty) { if ("visible" in node) node.visible = false; return; }
  if ("visible" in node) node.visible = true;
  await massLoadFonts(node);
  node.characters = String(value);
}

function massFindLayer(root, name) {
  if (root.name === name) return root;
  if (!("findOne" in root)) return null;
  return root.findOne(function(n) { return n.name === name; });
}

async function massFillCell(root, row, imageMap, warnings, rowIndex) {
  for (var i = 0; i < row.texts.length; i++) {
    var t = row.texts[i];
    var node = massFindLayer(root, t.layer);
    if (!node) continue;
    if (node.type !== "TEXT") { warnings.push("Linha " + (rowIndex + 1) + ": \"" + t.layer + "\" não é uma camada de texto."); continue; }
    await massSetText(node, t.value);
  }
  for (var j = 0; j < row.images.length; j++) {
    var im = row.images[j];
    var imgLayer = massFindLayer(root, im.layer);
    if (!imgLayer) continue;
    var isEmpty = !im.fileName || String(im.fileName).trim() === "";
    if (isEmpty) { if ("visible" in imgLayer) imgLayer.visible = false; continue; }
    var target = resolveImageTarget(imgLayer);
    if (!target) { warnings.push("Linha " + (rowIndex + 1) + ": \"" + im.layer + "\" sem alvo de imagem válido."); continue; }
    var raw = imageMap[String(im.fileName).toLowerCase()];
    if (!raw) { warnings.push("Linha " + (rowIndex + 1) + ": imagem \"" + im.fileName + "\" não foi selecionada/encontrada."); continue; }
    if ("visible" in imgLayer) imgLayer.visible = true;
    try { await applyImageFill(target, new Uint8Array(raw)); }
    catch (e) { warnings.push("Linha " + (rowIndex + 1) + ": erro ao inserir \"" + im.fileName + "\" — " + e.message); }
  }

  // Layout "3 veículos": visibilidade dos sub-frames Moto 01/02/03 dentro do card.
  if (row.slotVisibility) {
    for (var k = 0; k < row.slotVisibility.length; k++) {
      var sv = row.slotVisibility[k];
      var slotNode = null;
      if (root.name === sv.name) slotNode = root;
      else if ("findOne" in root) slotNode = root.findOne(function(n) { return n.name === sv.name; });
      if (!slotNode) {
        // fallback: busca a página inteira (compatível com o comportamento do modo manual)
        slotNode = figma.currentPage.findOne(function(n) { return n.name === sv.name; });
      }
      if (slotNode && "visible" in slotNode) slotNode.visible = sv.visible;
    }
  }
}

figma.ui.onmessage = async function(msg) {

  if (msg.type === "DETECT_MODE") {
    var mode = detectMode();
    figma.ui.postMessage({ type: "MODE_RESULT", mode: mode });
    return;
  }

  if (msg.type === "SCAN_PAGE") {
    var nodes = findNodesByPrefix(figma.currentPage, "$");
    var found = nodes.map(function(n) {
      var detail = "";
      if (n.type === "TEXT") {
        detail = "texto \u2713";
      } else if ("fills" in n) {
        var t = resolveImageTarget(n);
        detail = t === n ? "imagem \u2713" : t ? "imagem via filho \"" + t.name + "\" \u2713" : "\u26A0\uFE0F sem alvo v\u00e1lido";
      } else {
        detail = "\u26A0\uFE0F tipo n\u00e3o suportado";
      }
      return { name: n.name, type: n.type, detail: detail };
    });
    figma.ui.postMessage({ type: "SCAN_RESULT", found: found });
    return;
  }

  if (msg.type === "FILL") {
    var errors = [];
    var successes = [];
    for (var i = 0; i < msg.fields.length; i++) {
      var field = msg.fields[i];
      var result;
      if (field.kind === "info") result = await fillInfo(field.layerName, field.value);
      else if (field.kind === "text") result = await fillText(field.layerName, field.value);
      else if (field.kind === "image") result = await fillImage(field.layerName, field.base64);
      if (result.ok) successes.push(field.layerName);
      else errors.push(field.layerName + ": " + result.reason);
    }
    figma.ui.postMessage({ type: "FILL_RESULT", successes: successes, errors: errors });
    return;
  }

  if (msg.type === "FILL_TRIPLE") {
    // Preenche campos e controla visibilidade dos slots
    var errors = [];
    var successes = [];

    for (var i = 0; i < msg.fields.length; i++) {
      var field = msg.fields[i];
      var result;
      if (field.kind === "info") result = await fillInfo(field.layerName, field.value);
      else if (field.kind === "text") result = await fillText(field.layerName, field.value);
      else if (field.kind === "image") result = await fillImage(field.layerName, field.base64);
      if (result.ok) successes.push(field.layerName);
      else errors.push(field.layerName + ": " + result.reason);
    }

    // Controla visibilidade dos slots
    var slotNames = ["Moto 01", "Moto 02", "Moto 03"];
    for (var s = 0; s < msg.slotVisibility.length; s++) {
      setSlotVisibility(slotNames[s], msg.slotVisibility[s]);
    }

    figma.ui.postMessage({ type: "FILL_RESULT", successes: successes, errors: errors });
    return;
  }

  if (msg.type === "MASS_DETECT") {
    var reqD = msg.required || [];
    var rootsD = massGetRoots(massSelectionOrPage(), reqD);
    figma.ui.postMessage({ type: "MASS_DETECT_RESULT", count: rootsD.length });
    return;
  }

  if (msg.type === "MASS_DETECT_ALL") {
    var jobsD = msg.jobs || [];
    var countsD = {};
    for (var d = 0; d < jobsD.length; d++) {
      var jobD = jobsD[d];
      countsD[jobD.key] = massGetRoots(massSelectionOrPage(), jobD.required || []).length;
    }
    figma.ui.postMessage({ type: "MASS_DETECT_ALL_RESULT", counts: countsD });
    return;
  }

  if (msg.type === "MASS_FILL") {
    var result = await massFillTemplate(msg.required || [], msg.rows || [], msg.images || {});
    figma.ui.postMessage({ type: "MASS_FILL_RESULT", ok: result.ok, message: result.message, warnings: result.warnings });
    return;
  }

  if (msg.type === "MASS_FILL_ALL") {
    var jobs = msg.jobs || [];
    var images = msg.images || {};
    var results = {};
    for (var j = 0; j < jobs.length; j++) {
      var job = jobs[j];
      if (!job.rows || job.rows.length === 0) continue;
      results[job.key] = await massFillTemplate(job.required || [], job.rows, images);
    }
    figma.ui.postMessage({ type: "MASS_FILL_ALL_RESULT", results: results });
    return;
  }

  if (msg.type === "CLOSE") figma.closePlugin();
};

async function massFillTemplate(required, rows, images) {
  try {
    var warnings = [];
    var imageMap = {};
    Object.keys(images).forEach(function(k) { imageMap[k.toLowerCase()] = images[k]; });

    var flat = massSortReading(massGetRoots(massSelectionOrPage(), required));
    if (flat.length === 0) {
      return { ok: false, message: "Nenhum card encontrado na seleção nem na página para as camadas " + required.join(", ") + ".", warnings: [] };
    }

    var groups = massGroupByPage(flat);
    groups = massEnsurePages(groups, rows.length, warnings, required);
    groups = massTrimPages(groups, rows.length, warnings);

    var allCells = [];
    groups.forEach(function(g) { allCells = allCells.concat(g.cells); });

    var filled = 0, hiddenCount = 0;
    for (var i = 0; i < allCells.length; i++) {
      if (i < rows.length) {
        try {
          if ("visible" in allCells[i]) allCells[i].visible = true;
          await massFillCell(allCells[i], rows[i], imageMap, warnings, i);
          filled++;
        } catch (cellErr) {
          warnings.push("Linha " + (i + 1) + ": erro ao preencher — " + cellErr.message);
        }
      } else {
        if ("visible" in allCells[i]) { allCells[i].visible = false; hiddenCount++; }
      }
    }

    if (allCells.length < rows.length) {
      warnings.unshift("Atenção: " + allCells.length + " card(s) disponíveis, mas " + rows.length + " linha(s) na planilha. Preenchi os primeiros " + allCells.length + ".");
    }
    if (hiddenCount > 0) warnings.unshift(hiddenCount + " card(s) sem linha correspondente foram ocultados.");

    return { ok: true, message: "Produção concluída: " + filled + " card(s) preenchidos.", warnings: warnings };
  } catch (err) {
    return { ok: false, message: "Erro inesperado: " + err.message, warnings: [] };
  }
}

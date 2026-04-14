import connection from "../database/Connection.js";

export default class Product {
  static table = "product";

  // Mapeamento DataTable
  static #columns = [
    "id",
    "nome",
    "codigo_barra",
    "unidade",
    "preco_compra",
    "preco_venda",
    "ativo",
    "created_at",
    "updated_at",
    null,
  ];

  // Colunas pesquisáveis
  static #searchable = [
    "nome",
    "codigo_barra",
    "unidade",
    "preco_compra",
    "preco_venda",
  ];

  static async find(data = {}) {
    const {
      term = "",
      limit = 10,
      offset = 0,
      orderType = "asc",
      column = 0,
      draw = 1,
    } = data;

    const [{ count: total }] = await connection(Product.table).count(
      "id as count",
    );

    const search = term?.trim();

    function applySearch(query) {
      if (search) {
        query.where(function () {
          for (const col of Product.#searchable) {
            this.orWhereRaw(`CAST("${col}" AS TEXT) ILIKE ?`, [`%${search}%`]);
          }
        });
      }
      return query;
    }

    const filteredQ = connection(Product.table).count("id as count");
    applySearch(filteredQ);
    const [{ count: filtered }] = await filteredQ;

    const orderColumn = Product.#columns[column] || "id";
    const orderDir = orderType === "desc" ? "desc" : "asc";

    const dataQ = connection(Product.table).select("*");
    applySearch(dataQ);
    dataQ.orderBy(orderColumn, orderDir);
    dataQ.limit(parseInt(limit));
    dataQ.offset(parseInt(offset));

    const rows = await dataQ;

    return {
      draw: parseInt(draw),
      recordsTotal: parseInt(total),
      recordsFiltered: parseInt(filtered),
      data: rows,
    };
  }

  static async findById(id) {
    if (!id) return null;
    const row = await connection(Product.table).where({ id }).first();
    return row || null;
  }

  static async insert(data) {
    if (!data.nome || data.nome.trim() === "") {
      return { status: false, msg: "Nome é obrigatório", id: null, data: [] };
    }
    if (!data.preco_venda || parseFloat(data.preco_venda) <= 0) {
      return {
        status: false,
        msg: "Preço de venda é obrigatório e deve ser > 0",
        id: null,
        data: [],
      };
    }
    if (!data.unidade || data.unidade.trim() === "") {
      return {
        status: false,
        msg: "Unidade é obrigatória",
        id: null,
        data: [],
      };
    }

    try {
      const clean = Product.#sanitize(data);

      const [result] = await connection(Product.table)
        .insert(clean)
        .returning("*");

      return {
        status: true,
        msg: "Produto salvo!",
        id: result.id,
        data: [result],
      };
    } catch (err) {
      console.error("Erro ao inserir product:", err);
      return { status: false, msg: "Erro: " + err.message, id: null, data: [] };
    }
  }

  static async update(id, data) {
    if (!id) return { status: false, msg: "ID obrigatório", data: [] };

    try {
      const clean = Product.#sanitize(data);
      delete clean.id;

      const [result] = await connection(Product.table)
        .where({ id })
        .update(clean)
        .returning("*");

      if (!result)
        return { status: false, msg: "Produto não encontrado", data: [] };

      return {
        status: true,
        msg: "Produto atualizado!",
        id: result.id,
        data: [result],
      };
    } catch (err) {
      console.error("Erro ao atualizar product:", err);
      return { status: false, msg: "Erro: " + err.message, data: [] };
    }
  }

  static async delete(id) {
    if (!id) return { status: false, msg: "ID obrigatório" };

    try {
      await connection(Product.table).where({ id }).del();
      return { status: true, msg: "Produto excluído!" };
    } catch (err) {
      console.error("Erro ao remover product:", err);
      return { status: false, msg: "Erro: " + err.message };
    }
  }

  static #sanitize(data) {
    const ignore = ["id", "action"];
    const clean = {};

    for (const [key, value] of Object.entries(data)) {
      if (ignore.includes(key)) continue;
      if (value === "" || value === null || value === undefined) continue;

      if (["preco_compra", "preco_venda", "margem_lucro"].includes(key)) {
        // Remove pontos de milhar, troca vírgula decimal por ponto e converte para float
        clean[key] =
          parseFloat(
            String(value)
              .replace(/\./g, "") // remove pontos de milhar
              .replace(",", ".") // troca vírgula decimal por ponto
              .replace("R$ ", "") // remove prefixo R$ se houver
              .replace("% ", ""), // remove % se houver
          ) || 0;
      } else {
        clean[key] = value;
      }
    }

    return clean;
  }
}

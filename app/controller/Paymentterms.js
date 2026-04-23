const paymentTermsService = require('../service/paymentTermsService');

const paymentTermsController = {

  // Renderiza formulário de criação
  async renderCreate(req, res) {
    return res.render('pages/paymentterms', {
      titulo: 'Nova Condição de Pagamento',
      acao: 'inserir',
      id: '',
      paymentTerms: {},
    });
  },

  // Renderiza formulário de edição
  async renderEdit(req, res) {
    try {
      const { id } = req.params;
      const paymentTerms = await paymentTermsService.findById(id);

      if (!paymentTerms) {
        return res.status(404).json({ success: false, message: 'Condição de pagamento não encontrada.' });
      }

      return res.render('pages/paymentterms', {
        titulo: 'Editar Condição de Pagamento',
        acao: 'editar',
        id,
        paymentTerms,
      });
    } catch (error) {
      console.error('[renderEdit]', error);
      return res.status(500).json({ success: false, message: 'Erro ao carregar condição de pagamento.' });
    }
  },

  // Lista todas as condições de pagamento
  async list(req, res) {
    try {
      const { search = '' } = req.query;
      const data = await paymentTermsService.list(search);
      return res.json({ success: true, data });
    } catch (error) {
      console.error('[list]', error);
      return res.status(500).json({ success: false, message: 'Erro ao listar condições de pagamento.' });
    }
  },

  // Busca uma condição por ID (com suas parcelas)
  async findById(req, res) {
    try {
      const { id } = req.params;
      const data = await paymentTermsService.findById(id);

      if (!data) {
        return res.status(404).json({ success: false, message: 'Condição de pagamento não encontrada.' });
      }

      return res.json({ success: true, data });
    } catch (error) {
      console.error('[findById]', error);
      return res.status(500).json({ success: false, message: 'Erro ao buscar condição de pagamento.' });
    }
  },

  // Insere ou edita uma condição de pagamento
  async save(req, res) {
    try {
      const { acao, id, codigo, titulo, atalho, parcelas } = req.body;

      if (!codigo || !titulo) {
        return res.status(400).json({ success: false, message: 'Tipo de pagamento e título são obrigatórios.' });
      }

      if (!parcelas || !Array.isArray(parcelas) || parcelas.length === 0) {
        return res.status(400).json({ success: false, message: 'Informe ao menos uma parcela.' });
      }

      // Valida cada parcela
      for (const p of parcelas) {
        if (!p.parcela || !p.intervalo || p.vencimento_incial_parcela === undefined) {
          return res.status(400).json({ success: false, message: 'Dados de parcela inválidos.' });
        }
      }

      let result;

      if (acao === 'editar' && id) {
        result = await paymentTermsService.update(id, { codigo, titulo, atalho, parcelas });
      } else {
        result = await paymentTermsService.insert({ codigo, titulo, atalho, parcelas });
      }

      return res.json({ success: true, message: 'Condição de pagamento salva com sucesso.', data: result });
    } catch (error) {
      console.error('[save]', error);
      return res.status(500).json({ success: false, message: 'Erro ao salvar condição de pagamento.' });
    }
  },

  // Remove uma condição de pagamento
  async remove(req, res) {
    try {
      const { id } = req.params;
      await paymentTermsService.remove(id);
      return res.json({ success: true, message: 'Condição de pagamento removida com sucesso.' });
    } catch (error) {
      console.error('[remove]', error);
      return res.status(500).json({ success: false, message: 'Erro ao remover condição de pagamento.' });
    }
  },
};

module.exports = paymentTermsController;
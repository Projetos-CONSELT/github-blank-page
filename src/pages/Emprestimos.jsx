import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Search, 
  Plus, 
  MoreVertical,
  Truck,
  User,
  Package,
  Calendar,
  Loader2,
  Eye,
  Edit,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Camera,
  ArrowLeftRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function Emprestimos() {
  const [loading, setLoading] = useState(true);
  const [emprestimos, setEmprestimos] = useState([]);
  const [filteredEmprestimos, setFilteredEmprestimos] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  
  const [entregaModalOpen, setEntregaModalOpen] = useState(false);
  const [devolucaoModalOpen, setDevolucaoModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [renovacaoModalOpen, setRenovacaoModalOpen] = useState(false);
  
  const [selectedEmprestimo, setSelectedEmprestimo] = useState(null);
  const [saving, setSaving] = useState(false);

  const [entregaFormData, setEntregaFormData] = useState({
    solicitacao_id: '',
    pessoa_id: '',
    equipamento_id: '',
    data_retirada: moment().format('YYYY-MM-DD'),
    data_prevista_devolucao: moment().add(90, 'days').format('YYYY-MM-DD'),
    termo_aceite: false,
    observacoes_entrega: '',
  });

  const [devolucaoFormData, setDevolucaoFormData] = useState({
    estado_devolucao: 'bom',
    observacoes_devolucao: '',
  });

  useEffect(() => {
    loadData();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'entrega') {
      setEntregaModalOpen(true);
    } else if (urlParams.get('action') === 'devolucao') {
      setDevolucaoModalOpen(true);
    }
  }, []);

  useEffect(() => {
    filterEmprestimos();
  }, [emprestimos, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      const [emprestimosData, pessoasData, equipamentosData, solicitacoesData] = await Promise.all([
        base44.entities.Emprestimo.list('-created_date'),
        base44.entities.Pessoa.list(),
        base44.entities.Equipamento.list(),
        base44.entities.Solicitacao.filter({ status: 'liberado_retirada' }),
      ]);
      
      // Calcular status de vencimento
      const today = moment();
      const processedEmprestimos = emprestimosData.map(e => {
        if (e.status === 'devolvido' || e.status === 'comprado') return e;
        
        const devolucao = moment(e.data_prevista_devolucao);
        if (devolucao.isBefore(today)) {
          return { ...e, status: 'vencido' };
        } else if (devolucao.diff(today, 'days') <= 7) {
          return { ...e, status: 'vencendo' };
        }
        return e;
      });

      setEmprestimos(processedEmprestimos);
      setPessoas(pessoasData);
      setEquipamentos(equipamentosData);
      setSolicitacoes(solicitacoesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEmprestimos = () => {
    let filtered = [...emprestimos];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.pessoa_nome?.toLowerCase().includes(term) ||
        e.equipamento_codigo?.toLowerCase().includes(term) ||
        e.tipo_equipamento_nome?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'todos') {
      if (statusFilter === 'ativos') {
        filtered = filtered.filter(e => e.status === 'ativo' || e.status === 'vencendo' || e.status === 'vencido');
      } else {
        filtered = filtered.filter(e => e.status === statusFilter);
      }
    }

    setFilteredEmprestimos(filtered);
  };

  const openEntregaModal = () => {
    setEntregaFormData({
      solicitacao_id: '',
      pessoa_id: '',
      equipamento_id: '',
      data_retirada: moment().format('YYYY-MM-DD'),
      data_prevista_devolucao: moment().add(90, 'days').format('YYYY-MM-DD'),
      termo_aceite: false,
      observacoes_entrega: '',
    });
    setEntregaModalOpen(true);
  };

  const openDevolucaoModal = (emprestimo = null) => {
    setSelectedEmprestimo(emprestimo);
    setDevolucaoFormData({
      estado_devolucao: 'bom',
      observacoes_devolucao: '',
    });
    setDevolucaoModalOpen(true);
  };

  const openDetailModal = (emprestimo) => {
    setSelectedEmprestimo(emprestimo);
    setDetailModalOpen(true);
  };

  const openRenovacaoModal = (emprestimo) => {
    setSelectedEmprestimo(emprestimo);
    setRenovacaoModalOpen(true);
  };

  const handleEntrega = async () => {
    if (!entregaFormData.pessoa_id || !entregaFormData.equipamento_id || !entregaFormData.termo_aceite) return;
    
    setSaving(true);
    try {
      const pessoa = pessoas.find(p => p.id === entregaFormData.pessoa_id);
      const equipamento = equipamentos.find(e => e.id === entregaFormData.equipamento_id);

      const data = {
        ...entregaFormData,
        pessoa_nome: pessoa?.nome,
        equipamento_codigo: equipamento?.codigo,
        tipo_equipamento_nome: equipamento?.tipo_nome,
        status: 'ativo',
        renovacoes: 0,
        historico: [{
          acao: 'Empréstimo registrado',
          data: new Date().toISOString(),
          usuario: 'Atendente',
        }]
      };

      await base44.entities.Emprestimo.create(data);

      // Atualizar equipamento
      await base44.entities.Equipamento.update(entregaFormData.equipamento_id, {
        status: 'emprestado',
      });

      // Atualizar solicitação se existir
      if (entregaFormData.solicitacao_id) {
        await base44.entities.Solicitacao.update(entregaFormData.solicitacao_id, {
          status: 'concluida',
        });
      }

      await loadData();
      setEntregaModalOpen(false);
    } catch (error) {
      console.error('Erro ao registrar entrega:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDevolucao = async () => {
    if (!selectedEmprestimo) return;
    
    setSaving(true);
    try {
      const historico = selectedEmprestimo.historico || [];
      historico.push({
        acao: 'Devolução registrada',
        data: new Date().toISOString(),
        usuario: 'Atendente',
        detalhes: `Estado: ${devolucaoFormData.estado_devolucao}`,
      });

      await base44.entities.Emprestimo.update(selectedEmprestimo.id, {
        status: 'devolvido',
        data_devolucao: new Date().toISOString(),
        estado_devolucao: devolucaoFormData.estado_devolucao,
        observacoes_devolucao: devolucaoFormData.observacoes_devolucao,
        historico,
      });

      // Atualizar equipamento
      const novoStatusEquipamento = devolucaoFormData.estado_devolucao === 'necessita_manutencao' 
        ? 'manutencao' 
        : 'disponivel';
      
      await base44.entities.Equipamento.update(selectedEmprestimo.equipamento_id, {
        status: novoStatusEquipamento,
        estado_conservacao: devolucaoFormData.estado_devolucao === 'necessita_manutencao' 
          ? 'necessita_manutencao' 
          : devolucaoFormData.estado_devolucao,
      });

      await loadData();
      setDevolucaoModalOpen(false);
    } catch (error) {
      console.error('Erro ao registrar devolução:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRenovacao = async () => {
    if (!selectedEmprestimo) return;
    
    setSaving(true);
    try {
      const novaDataDevolucao = moment(selectedEmprestimo.data_prevista_devolucao).add(30, 'days').toISOString();
      
      const historico = selectedEmprestimo.historico || [];
      historico.push({
        acao: `Renovação ${(selectedEmprestimo.renovacoes || 0) + 1}`,
        data: new Date().toISOString(),
        usuario: 'Atendente',
        detalhes: `Nova data: ${moment(novaDataDevolucao).format('DD/MM/YYYY')}`,
      });

      await base44.entities.Emprestimo.update(selectedEmprestimo.id, {
        data_prevista_devolucao: novaDataDevolucao,
        renovacoes: (selectedEmprestimo.renovacoes || 0) + 1,
        status: 'ativo',
        historico,
      });

      await loadData();
      setRenovacaoModalOpen(false);
    } catch (error) {
      console.error('Erro ao renovar:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      ativo: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      vencendo: { label: 'Vencendo', className: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
      vencido: { label: 'Vencido', className: 'bg-red-100 text-red-700', icon: XCircle },
      devolvido: { label: 'Devolvido', className: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      comprado: { label: 'Comprado', className: 'bg-purple-100 text-purple-700', icon: Package },
    };
    const c = config[status] || { label: status, className: 'bg-gray-100 text-gray-700', icon: Clock };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  // Contadores
  const statusCounts = {
    ativos: emprestimos.filter(e => e.status === 'ativo').length,
    vencendo: emprestimos.filter(e => e.status === 'vencendo').length,
    vencidos: emprestimos.filter(e => e.status === 'vencido').length,
    devolvidos: emprestimos.filter(e => e.status === 'devolvido').length,
  };

  const equipamentosDisponiveis = equipamentos.filter(e => e.status === 'disponivel');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('ativos')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Ativos</p>
                <p className="text-2xl font-bold text-emerald-600">{statusCounts.ativos}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('vencendo')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Vencendo</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.vencendo}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('vencido')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.vencidos}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('devolvido')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Devolvidos</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.devolvidos}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por pessoa, equipamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="vencendo">Vencendo</SelectItem>
              <SelectItem value="vencido">Vencidos</SelectItem>
              <SelectItem value="devolvido">Devolvidos</SelectItem>
              <SelectItem value="comprado">Comprados</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => openDevolucaoModal()} className="gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Registrar Devolução
          </Button>
          <Button onClick={openEntregaModal} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Truck className="w-4 h-4" />
            Registrar Entrega
          </Button>
        </div>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {filteredEmprestimos.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum empréstimo encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEmprestimos.map((emprestimo) => (
                <div 
                  key={emprestimo.id} 
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      emprestimo.status === 'vencido' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                      emprestimo.status === 'vencendo' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                      emprestimo.status === 'devolvido' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    }`}>
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{emprestimo.pessoa_nome}</p>
                        {getStatusBadge(emprestimo.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {emprestimo.equipamento_codigo} - {emprestimo.tipo_equipamento_nome}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Devolução: {moment(emprestimo.data_prevista_devolucao).format('DD/MM/YYYY')}
                        </span>
                        {emprestimo.renovacoes > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {emprestimo.renovacoes} renovação(ões)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(emprestimo.status === 'ativo' || emprestimo.status === 'vencendo') && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openRenovacaoModal(emprestimo)}
                          disabled={emprestimo.renovacoes >= 3}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Renovar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDevolucaoModal(emprestimo)}
                        >
                          Devolver
                        </Button>
                      </>
                    )}
                    {emprestimo.status === 'vencido' && (
                      <Button 
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => openDevolucaoModal(emprestimo)}
                      >
                        Registrar Devolução
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetailModal(emprestimo)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Entrega */}
      <Dialog open={entregaModalOpen} onOpenChange={setEntregaModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Entrega</DialogTitle>
            <DialogDescription>
              Registre a entrega de um equipamento para empréstimo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {solicitacoes.length > 0 && (
              <div>
                <Label>Solicitação (opcional)</Label>
                <Select 
                  value={entregaFormData.solicitacao_id} 
                  onValueChange={(v) => {
                    const sol = solicitacoes.find(s => s.id === v);
                    setEntregaFormData({ 
                      ...entregaFormData, 
                      solicitacao_id: v,
                      pessoa_id: sol?.responsavel_id || '',
                      equipamento_id: sol?.equipamento_reservado_id || '',
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma solicitação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma solicitação</SelectItem>
                    {solicitacoes.map(sol => (
                      <SelectItem key={sol.id} value={sol.id}>
                        #{sol.protocolo} - {sol.responsavel_nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Pessoa *</Label>
              <Select 
                value={entregaFormData.pessoa_id} 
                onValueChange={(v) => setEntregaFormData({ ...entregaFormData, pessoa_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a pessoa" />
                </SelectTrigger>
                <SelectContent>
                  {pessoas.map(pessoa => (
                    <SelectItem key={pessoa.id} value={pessoa.id}>{pessoa.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Equipamento *</Label>
              <Select 
                value={entregaFormData.equipamento_id} 
                onValueChange={(v) => setEntregaFormData({ ...entregaFormData, equipamento_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipamentosDisponiveis.map(equipamento => (
                    <SelectItem key={equipamento.id} value={equipamento.id}>
                      {equipamento.codigo} - {equipamento.tipo_nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Retirada</Label>
                <Input
                  type="date"
                  value={entregaFormData.data_retirada}
                  onChange={(e) => setEntregaFormData({ ...entregaFormData, data_retirada: e.target.value })}
                />
              </div>
              <div>
                <Label>Previsão de Devolução</Label>
                <Input
                  type="date"
                  value={entregaFormData.data_prevista_devolucao}
                  onChange={(e) => setEntregaFormData({ ...entregaFormData, data_prevista_devolucao: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={entregaFormData.observacoes_entrega}
                onChange={(e) => setEntregaFormData({ ...entregaFormData, observacoes_entrega: e.target.value })}
                placeholder="Observações sobre a entrega..."
              />
            </div>

            <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg">
              <Checkbox
                id="termo"
                checked={entregaFormData.termo_aceite}
                onCheckedChange={(checked) => setEntregaFormData({ ...entregaFormData, termo_aceite: checked })}
              />
              <label htmlFor="termo" className="text-sm cursor-pointer">
                Confirmo que a pessoa recebeu o equipamento e está ciente das regras de uso e devolução
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEntregaModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEntrega} 
              disabled={saving || !entregaFormData.pessoa_id || !entregaFormData.equipamento_id || !entregaFormData.termo_aceite}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Devolução */}
      <Dialog open={devolucaoModalOpen} onOpenChange={setDevolucaoModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Devolução</DialogTitle>
            <DialogDescription>
              {selectedEmprestimo 
                ? `Devolução do equipamento ${selectedEmprestimo.equipamento_codigo} - ${selectedEmprestimo.pessoa_nome}`
                : 'Selecione um empréstimo para registrar a devolução'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!selectedEmprestimo && (
              <div>
                <Label>Empréstimo *</Label>
                <Select 
                  onValueChange={(v) => {
                    const emp = emprestimos.find(e => e.id === v);
                    setSelectedEmprestimo(emp);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o empréstimo" />
                  </SelectTrigger>
                  <SelectContent>
                    {emprestimos
                      .filter(e => e.status === 'ativo' || e.status === 'vencendo' || e.status === 'vencido')
                      .map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.equipamento_codigo} - {emp.pessoa_nome}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Estado do Equipamento na Devolução</Label>
              <Select 
                value={devolucaoFormData.estado_devolucao} 
                onValueChange={(v) => setDevolucaoFormData({ ...devolucaoFormData, estado_devolucao: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bom">Bom</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="danificado">Danificado</SelectItem>
                  <SelectItem value="necessita_manutencao">Necessita Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={devolucaoFormData.observacoes_devolucao}
                onChange={(e) => setDevolucaoFormData({ ...devolucaoFormData, observacoes_devolucao: e.target.value })}
                placeholder="Observações sobre a devolução..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDevolucaoModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDevolucao} 
              disabled={saving || !selectedEmprestimo}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Renovação */}
      <Dialog open={renovacaoModalOpen} onOpenChange={setRenovacaoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Renovar Empréstimo</DialogTitle>
            <DialogDescription>
              {selectedEmprestimo && (
                <>
                  Renovar empréstimo de {selectedEmprestimo.pessoa_nome}
                  <br />
                  Equipamento: {selectedEmprestimo.equipamento_codigo}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmprestimo && (
            <div className="py-4 space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Data atual de devolução:</span>
                  <span className="font-medium">
                    {moment(selectedEmprestimo.data_prevista_devolucao).format('DD/MM/YYYY')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Nova data de devolução:</span>
                  <span className="font-medium text-blue-600">
                    {moment(selectedEmprestimo.data_prevista_devolucao).add(30, 'days').format('DD/MM/YYYY')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Renovações já realizadas:</span>
                  <span className="font-medium">{selectedEmprestimo.renovacoes || 0} de 3</span>
                </div>
              </div>

              {selectedEmprestimo.renovacoes >= 3 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Limite de renovações atingido
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRenovacaoModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRenovacao} 
              disabled={saving || (selectedEmprestimo?.renovacoes >= 3)}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Renovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Detalhes do Empréstimo
              {selectedEmprestimo && getStatusBadge(selectedEmprestimo.status)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmprestimo && (
            <Tabs defaultValue="dados" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dados" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Pessoa</p>
                    <p className="font-medium">{selectedEmprestimo.pessoa_nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Equipamento</p>
                    <p className="font-medium">{selectedEmprestimo.equipamento_codigo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tipo</p>
                    <p className="font-medium">{selectedEmprestimo.tipo_equipamento_nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Renovações</p>
                    <p className="font-medium">{selectedEmprestimo.renovacoes || 0} de 3</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Data de Retirada</p>
                    <p className="font-medium">{moment(selectedEmprestimo.data_retirada).format('DD/MM/YYYY')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Previsão de Devolução</p>
                    <p className="font-medium">{moment(selectedEmprestimo.data_prevista_devolucao).format('DD/MM/YYYY')}</p>
                  </div>
                  {selectedEmprestimo.data_devolucao && (
                    <>
                      <div>
                        <p className="text-sm text-slate-500">Data de Devolução</p>
                        <p className="font-medium">{moment(selectedEmprestimo.data_devolucao).format('DD/MM/YYYY')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Estado na Devolução</p>
                        <p className="font-medium">{selectedEmprestimo.estado_devolucao}</p>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="historico" className="mt-4">
                {selectedEmprestimo.historico && selectedEmprestimo.historico.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEmprestimo.historico.map((item, index) => (
                      <div key={index} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                        <div>
                          <p className="font-medium text-sm">{item.acao}</p>
                          <p className="text-xs text-slate-500">
                            {moment(item.data).format('DD/MM/YYYY HH:mm')} • {item.usuario}
                          </p>
                          {item.detalhes && (
                            <p className="text-sm text-slate-600 mt-1">{item.detalhes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-slate-500">Sem histórico registrado</p>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
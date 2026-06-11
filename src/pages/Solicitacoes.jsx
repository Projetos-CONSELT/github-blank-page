import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Search, 
  Plus, 
  Filter,
  MoreVertical,
  FileText,
  User,
  Package,
  Calendar,
  Loader2,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

export default function Solicitacoes() {
  const [loading, setLoading] = useState(true);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [filteredSolicitacoes, setFilteredSolicitacoes] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [tiposEquipamento, setTiposEquipamento] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    responsavel_id: '',
    beneficiario_id: '',
    tipo_equipamento_id: '',
    observacoes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSolicitacoes();
  }, [solicitacoes, searchTerm, statusFilter, tipoFilter]);

  const loadData = async () => {
    try {
      const [solicitacoesData, pessoasData, tiposData, equipamentosData] = await Promise.all([
        base44.entities.Solicitacao.list('-created_date'),
        base44.entities.Pessoa.list(),
        base44.entities.TipoEquipamento.list(),
        base44.entities.Equipamento.list(),
      ]);
      setSolicitacoes(solicitacoesData);
      setPessoas(pessoasData);
      setTiposEquipamento(tiposData);
      setEquipamentos(equipamentosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSolicitacoes = () => {
    let filtered = [...solicitacoes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.protocolo?.toLowerCase().includes(term) ||
        s.responsavel_nome?.toLowerCase().includes(term) ||
        s.beneficiario_nome?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(s => s.tipo_equipamento_id === tipoFilter);
    }

    setFilteredSolicitacoes(filtered);
  };

  const generateProtocolo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SOL-${year}${month}${day}-${random}`;
  };

  const openNewModal = () => {
    setFormData({
      responsavel_id: '',
      beneficiario_id: '',
      tipo_equipamento_id: '',
      observacoes: '',
    });
    setIsEditing(false);
    setSelectedSolicitacao(null);
    setModalOpen(true);
  };

  const openDetailModal = (solicitacao) => {
    setSelectedSolicitacao(solicitacao);
    setDetailModalOpen(true);
  };

  const openTriageModal = (solicitacao) => {
    setSelectedSolicitacao(solicitacao);
    setTriageModalOpen(true);
  };

  const openReserveModal = (solicitacao) => {
    setSelectedSolicitacao(solicitacao);
    setReserveModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.responsavel_id || !formData.tipo_equipamento_id) return;
    
    setSaving(true);
    try {
      const responsavel = pessoas.find(p => p.id === formData.responsavel_id);
      const beneficiario = formData.beneficiario_id ? pessoas.find(p => p.id === formData.beneficiario_id) : null;
      const tipo = tiposEquipamento.find(t => t.id === formData.tipo_equipamento_id);

      const data = {
        ...formData,
        protocolo: generateProtocolo(),
        responsavel_nome: responsavel?.nome,
        beneficiario_nome: beneficiario?.nome,
        tipo_equipamento_nome: tipo?.nome,
        status: 'nova',
        historico: [{
          acao: 'Solicitação criada',
          data: new Date().toISOString(),
          usuario: 'Sistema',
        }]
      };

      await base44.entities.Solicitacao.create(data);
      await loadData();
      setModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (solicitacao, newStatus, motivo = '') => {
    setSaving(true);
    try {
      const historico = solicitacao.historico || [];
      historico.push({
        acao: `Status alterado para: ${newStatus}`,
        data: new Date().toISOString(),
        usuario: 'Atendente',
        detalhes: motivo,
      });

      await base44.entities.Solicitacao.update(solicitacao.id, {
        status: newStatus,
        motivo_status: motivo,
        historico,
      });
      
      await loadData();
      setTriageModalOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReserve = async (equipamentoId) => {
    if (!selectedSolicitacao) return;
    
    setSaving(true);
    try {
      const equipamento = equipamentos.find(e => e.id === equipamentoId);
      const dataLimite = moment().add(7, 'days').toISOString();

      // Atualizar solicitação
      const historico = selectedSolicitacao.historico || [];
      historico.push({
        acao: 'Equipamento reservado',
        data: new Date().toISOString(),
        usuario: 'Atendente',
        detalhes: `Equipamento: ${equipamento?.codigo}`,
      });

      await base44.entities.Solicitacao.update(selectedSolicitacao.id, {
        status: 'reservado',
        equipamento_reservado_id: equipamentoId,
        data_reserva: new Date().toISOString(),
        data_limite_retirada: dataLimite,
        historico,
      });

      // Atualizar equipamento
      await base44.entities.Equipamento.update(equipamentoId, {
        status: 'reservado',
      });

      await loadData();
      setReserveModalOpen(false);
    } catch (error) {
      console.error('Erro ao reservar equipamento:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (solicitacao) => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) return;
    
    try {
      await base44.entities.Solicitacao.delete(solicitacao.id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      nova: { label: 'Nova', className: 'bg-blue-100 text-blue-700', icon: Plus },
      em_triagem: { label: 'Em Triagem', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
      pendente_documentos: { label: 'Pendente', className: 'bg-orange-100 text-orange-700', icon: AlertCircle },
      em_fila: { label: 'Em Fila', className: 'bg-purple-100 text-purple-700', icon: Clock },
      reservado: { label: 'Reservado', className: 'bg-cyan-100 text-cyan-700', icon: Package },
      liberado_retirada: { label: 'Liberado', className: 'bg-green-100 text-green-700', icon: CheckCircle },
      concluida: { label: 'Concluída', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-700', icon: XCircle },
    };
    return config[status] || { label: status, className: 'bg-gray-100 text-gray-700', icon: FileText };
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig(status);
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Contadores por status
  const statusCounts = {
    nova: solicitacoes.filter(s => s.status === 'nova').length,
    em_triagem: solicitacoes.filter(s => s.status === 'em_triagem').length,
    em_fila: solicitacoes.filter(s => s.status === 'em_fila').length,
    reservado: solicitacoes.filter(s => s.status === 'reservado').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs de Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('nova')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Novas</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.nova}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('em_triagem')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Em Triagem</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.em_triagem}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('em_fila')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Em Fila</p>
                <p className="text-2xl font-bold text-purple-600">{statusCounts.em_fila}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('reservado')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Reservados</p>
                <p className="text-2xl font-bold text-cyan-600">{statusCounts.reservado}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-cyan-600" />
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
            placeholder="Buscar por protocolo, responsável..."
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
              <SelectItem value="nova">Nova</SelectItem>
              <SelectItem value="em_triagem">Em Triagem</SelectItem>
              <SelectItem value="pendente_documentos">Pendente</SelectItem>
              <SelectItem value="em_fila">Em Fila</SelectItem>
              <SelectItem value="reservado">Reservado</SelectItem>
              <SelectItem value="liberado_retirada">Liberado</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {tiposEquipamento.map(tipo => (
                <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openNewModal} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Nova Solicitação
          </Button>
        </div>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {filteredSolicitacoes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSolicitacoes.map((solicitacao) => (
                <div 
                  key={solicitacao.id} 
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">#{solicitacao.protocolo}</p>
                        {getStatusBadge(solicitacao.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {solicitacao.responsavel_nome || 'Responsável'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {solicitacao.tipo_equipamento_nome || 'Equipamento'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {moment(solicitacao.created_date).format('DD/MM/YYYY')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {solicitacao.status === 'nova' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openTriageModal(solicitacao)}
                      >
                        Iniciar Triagem
                      </Button>
                    )}
                    {solicitacao.status === 'em_fila' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openReserveModal(solicitacao)}
                      >
                        Reservar
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetailModal(solicitacao)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openTriageModal(solicitacao)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Triar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(solicitacao)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
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

      {/* Modal Nova Solicitação */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Solicitação</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova solicitação
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Responsável *</Label>
              <Select 
                value={formData.responsavel_id} 
                onValueChange={(v) => setFormData({ ...formData, responsavel_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {pessoas.filter(p => p.papeis?.includes('responsavel')).map(pessoa => (
                    <SelectItem key={pessoa.id} value={pessoa.id}>{pessoa.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Beneficiário (opcional)</Label>
              <Select 
                value={formData.beneficiario_id} 
                onValueChange={(v) => setFormData({ ...formData, beneficiario_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o beneficiário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum (mesmo responsável)</SelectItem>
                  {pessoas.filter(p => p.papeis?.includes('beneficiario')).map(pessoa => (
                    <SelectItem key={pessoa.id} value={pessoa.id}>{pessoa.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Equipamento *</Label>
              <Select 
                value={formData.tipo_equipamento_id} 
                onValueChange={(v) => setFormData({ ...formData, tipo_equipamento_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposEquipamento.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações sobre a solicitação..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.responsavel_id || !formData.tipo_equipamento_id}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Solicitação #{selectedSolicitacao?.protocolo}
              {selectedSolicitacao && getStatusBadge(selectedSolicitacao.status)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSolicitacao && (
            <Tabs defaultValue="dados" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dados" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Responsável</p>
                    <p className="font-medium">{selectedSolicitacao.responsavel_nome || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Beneficiário</p>
                    <p className="font-medium">{selectedSolicitacao.beneficiario_nome || 'Mesmo responsável'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tipo de Equipamento</p>
                    <p className="font-medium">{selectedSolicitacao.tipo_equipamento_nome || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Data da Solicitação</p>
                    <p className="font-medium">{moment(selectedSolicitacao.created_date).format('DD/MM/YYYY HH:mm')}</p>
                  </div>
                  {selectedSolicitacao.data_reserva && (
                    <>
                      <div>
                        <p className="text-sm text-slate-500">Data da Reserva</p>
                        <p className="font-medium">{moment(selectedSolicitacao.data_reserva).format('DD/MM/YYYY')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Limite para Retirada</p>
                        <p className="font-medium">{moment(selectedSolicitacao.data_limite_retirada).format('DD/MM/YYYY')}</p>
                      </div>
                    </>
                  )}
                  {selectedSolicitacao.observacoes && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500">Observações</p>
                      <p className="font-medium">{selectedSolicitacao.observacoes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="historico" className="mt-4">
                {selectedSolicitacao.historico && selectedSolicitacao.historico.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSolicitacao.historico.map((item, index) => (
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

      {/* Modal de Triagem */}
      <Dialog open={triageModalOpen} onOpenChange={setTriageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Triagem da Solicitação</DialogTitle>
            <DialogDescription>
              #{selectedSolicitacao?.protocolo}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Selecione a ação para esta solicitação:
            </p>
            <div className="space-y-2">
              <Button 
                className="w-full justify-start gap-3" 
                variant="outline"
                onClick={() => updateStatus(selectedSolicitacao, 'em_triagem')}
              >
                <Clock className="w-4 h-4 text-yellow-600" />
                Manter em Triagem
              </Button>
              <Button 
                className="w-full justify-start gap-3" 
                variant="outline"
                onClick={() => updateStatus(selectedSolicitacao, 'pendente_documentos', 'Aguardando documentos')}
              >
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Solicitar Documentos
              </Button>
              <Button 
                className="w-full justify-start gap-3" 
                variant="outline"
                onClick={() => updateStatus(selectedSolicitacao, 'em_fila')}
              >
                <ArrowRight className="w-4 h-4 text-purple-600" />
                Enviar para Fila
              </Button>
              <Button 
                className="w-full justify-start gap-3 text-red-600" 
                variant="outline"
                onClick={() => updateStatus(selectedSolicitacao, 'cancelada', 'Cancelado na triagem')}
              >
                <XCircle className="w-4 h-4" />
                Cancelar Solicitação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Reserva */}
      <Dialog open={reserveModalOpen} onOpenChange={setReserveModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reservar Equipamento</DialogTitle>
            <DialogDescription>
              Selecione um equipamento disponível para reservar
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {equipamentos
                .filter(e => 
                  e.status === 'disponivel' && 
                  e.tipo_id === selectedSolicitacao?.tipo_equipamento_id
                )
                .map(equipamento => (
                  <div 
                    key={equipamento.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleReserve(equipamento.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium">{equipamento.codigo}</p>
                        <p className="text-sm text-slate-500">{equipamento.tipo_nome}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">Disponível</Badge>
                  </div>
                ))
              }
              {equipamentos.filter(e => e.status === 'disponivel' && e.tipo_id === selectedSolicitacao?.tipo_equipamento_id).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum equipamento disponível deste tipo</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReserveModalOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
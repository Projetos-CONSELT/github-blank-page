import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  GripVertical,
  User,
  Package,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Loader2,
  RefreshCw,
  Filter,
  Bell,
  ChevronRight,
  Star,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function Fila() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filas, setFilas] = useState({});
  const [tiposEquipamento, setTiposEquipamento] = useState([]);
  const [tipoSelecionado, setTipoSelecionado] = useState('todos');
  const [equipamentos, setEquipamentos] = useState([]);
  const [liberarModalOpen, setLiberarModalOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [solicitacoes, tipos, equips] = await Promise.all([
        base44.entities.Solicitacao.filter({ status: 'em_fila' }, '-prioridade'),
        base44.entities.TipoEquipamento.list(),
        base44.entities.Equipamento.list(),
      ]);

      // Agrupar por tipo de equipamento
      const agrupado = {};
      tipos.forEach(tipo => {
        agrupado[tipo.id] = {
          tipo,
          itens: solicitacoes
            .filter(s => s.tipo_equipamento_id === tipo.id)
            .sort((a, b) => (b.prioridade || 0) - (a.prioridade || 0)),
        };
      });

      setFilas(agrupado);
      setTiposEquipamento(tipos);
      setEquipamentos(equips);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result, tipoId) => {
    if (!result.destination) return;
    const items = Array.from(filas[tipoId]?.itens || []);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    // Recalcular prioridades
    const updated = items.map((item, index) => ({ ...item, posicao_fila: index + 1 }));
    setFilas(prev => ({ ...prev, [tipoId]: { ...prev[tipoId], itens: updated } }));

    // Salvar no banco
    await Promise.all(
      updated.map(item =>
        base44.entities.Solicitacao.update(item.id, { posicao_fila: item.posicao_fila })
      )
    );
  };

  const setPrioridade = async (solicitacao, alta) => {
    const novaPrioridade = alta ? 10 : 0;
    await base44.entities.Solicitacao.update(solicitacao.id, { prioridade: novaPrioridade });
    await loadData();
  };

  const openLiberar = (sol) => {
    setSelectedSolicitacao(sol);
    setObservacao('');
    setLiberarModalOpen(true);
  };

  const handleLiberar = async () => {
    if (!selectedSolicitacao) return;
    setSaving(true);
    try {
      const historico = selectedSolicitacao.historico || [];
      historico.push({
        acao: 'Liberado para retirada',
        data: new Date().toISOString(),
        usuario: 'Atendente',
        detalhes: observacao,
      });
      await base44.entities.Solicitacao.update(selectedSolicitacao.id, {
        status: 'liberado_retirada',
        historico,
      });
      await loadData();
      setLiberarModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const tiposFiltrados = tipoSelecionado === 'todos'
    ? Object.values(filas)
    : Object.values(filas).filter(f => f.tipo.id === tipoSelecionado);

  const totalNaFila = Object.values(filas).reduce((acc, f) => acc + f.itens.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gerenciamento de Fila</h2>
          <p className="text-sm text-slate-500">{totalNaFila} solicitação(ões) aguardando na fila</p>
        </div>
        <div className="flex gap-3">
          <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
            <SelectTrigger className="w-52">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {tiposEquipamento.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de fila por tipo */}
      {tiposFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhuma solicitação na fila</p>
            <p className="text-sm">Todas as solicitações foram atendidas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {tiposFiltrados.map(({ tipo, itens }) => {
            const disponiveis = equipamentos.filter(e => e.tipo_id === tipo.id && e.status === 'disponivel').length;
            return (
              <Card key={tipo.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/30 flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-200" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{tipo.nome}</CardTitle>
                        <p className="text-slate-300 text-xs">{itens.length} na fila • {disponiveis} disponíveis</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {disponiveis > 0 && (
                        <Badge className="bg-emerald-500/30 text-emerald-200 border-0">
                          {disponiveis} livre{disponiveis > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {disponiveis === 0 && itens.length > 0 && (
                        <Badge className="bg-red-500/30 text-red-200 border-0">
                          Sem estoque
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {itens.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Fila vazia</p>
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={(result) => onDragEnd(result, tipo.id)}>
                      <Droppable droppableId={tipo.id}>
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="divide-y divide-slate-100"
                          >
                            {itens.map((item, index) => (
                              <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-3 p-4 transition-colors ${
                                      snapshot.isDragging ? 'bg-blue-50 shadow-lg' : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab">
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                      item.prioridade > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-slate-900 text-sm truncate">
                                          {item.responsavel_nome || 'Responsável'}
                                        </p>
                                        {item.prioridade > 0 && (
                                          <Badge className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0">
                                            <Star className="w-2.5 h-2.5 mr-0.5" />
                                            Prioridade
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500">
                                        #{item.protocolo} • {moment(item.created_date).fromNow()}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        title={item.prioridade > 0 ? 'Remover prioridade' : 'Priorizar'}
                                        onClick={() => setPrioridade(item, item.prioridade === 0)}
                                      >
                                        <Star className={`w-3.5 h-3.5 ${item.prioridade > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                      </Button>
                                      {disponiveis > 0 && (
                                        <Button
                                          size="sm"
                                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                          onClick={() => openLiberar(item)}
                                        >
                                          Liberar
                                          <ChevronRight className="w-3 h-3 ml-1" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Liberar */}
      <Dialog open={liberarModalOpen} onOpenChange={setLiberarModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Liberar para Retirada</DialogTitle>
            <DialogDescription>
              {selectedSolicitacao && `Solicitação #${selectedSolicitacao.protocolo} — ${selectedSolicitacao.responsavel_nome}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              O responsável será notificado que pode retirar o equipamento.
            </div>
            <div>
              <Label>Observação (opcional)</Label>
              <Textarea
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                placeholder="Informações adicionais para o responsável..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLiberarModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleLiberar} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Liberação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Wrench,
  Plus,
  Search,
  Package,
  Calendar,
  Loader2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowRight,
  Settings
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function Manutencao() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [equipamentosManutencao, setEquipamentosManutencao] = useState([]);
  const [todosEquipamentos, setTodosEquipamentos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [enviarModalOpen, setEnviarModalOpen] = useState(false);
  const [concluirModalOpen, setConcluirModalOpen] = useState(false);
  const [selectedEquipamento, setSelectedEquipamento] = useState(null);
  const [formData, setFormData] = useState({
    equipamento_id: '',
    motivo: '',
    data_prevista: moment().add(15, 'days').format('YYYY-MM-DD'),
  });
  const [concluirForm, setConcluirForm] = useState({
    estado_conservacao: 'bom',
    observacoes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const equips = await base44.entities.Equipamento.list('-updated_date');
      setTodosEquipamentos(equips);
      setEquipamentosManutencao(equips.filter(e => e.status === 'manutencao'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviar = async () => {
    if (!formData.equipamento_id) return;
    setSaving(true);
    try {
      await base44.entities.Equipamento.update(formData.equipamento_id, {
        status: 'manutencao',
        estado_conservacao: 'necessita_manutencao',
        observacoes: formData.motivo,
      });
      await loadData();
      setEnviarModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleConcluir = async () => {
    if (!selectedEquipamento) return;
    setSaving(true);
    try {
      await base44.entities.Equipamento.update(selectedEquipamento.id, {
        status: 'disponivel',
        estado_conservacao: concluirForm.estado_conservacao,
        observacoes: concluirForm.observacoes,
      });
      await loadData();
      setConcluirModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = equipamentosManutencao.filter(e =>
    !searchTerm ||
    e.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.tipo_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const disponivelParaEnvio = todosEquipamentos.filter(e => e.status === 'disponivel' || e.status === 'reservado');

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white border-0">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Em Manutenção</p>
              <p className="text-4xl font-bold">{equipamentosManutencao.length}</p>
            </div>
            <Wrench className="w-12 h-12 text-yellow-300" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-600 to-slate-700 text-white border-0">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-sm">Total de Equipamentos</p>
              <p className="text-4xl font-bold">{todosEquipamentos.length}</p>
            </div>
            <Package className="w-12 h-12 text-slate-400" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Disponíveis</p>
              <p className="text-4xl font-bold">{todosEquipamentos.filter(e => e.status === 'disponivel').length}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-emerald-300" />
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input placeholder="Buscar por código ou tipo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={() => setEnviarModalOpen(true)} className="gap-2 bg-yellow-600 hover:bg-yellow-700">
          <Wrench className="w-4 h-4" />
          Enviar para Manutenção
        </Button>
      </div>

      {/* Lista em manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-5 h-5 text-yellow-600" />
            Equipamentos em Manutenção
          </CardTitle>
          <CardDescription>{filtered.length} equipamento(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-50" />
              <p className="text-lg font-medium">Nenhum equipamento em manutenção</p>
              <p className="text-sm">Todos os equipamentos estão em bom estado!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(equip => (
                <div key={equip.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{equip.codigo}</p>
                        <Badge className="bg-yellow-100 text-yellow-700">Manutenção</Badge>
                      </div>
                      <p className="text-sm text-slate-500">{equip.tipo_nome || '—'}</p>
                      {equip.observacoes && (
                        <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{equip.observacoes}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setSelectedEquipamento(equip);
                      setConcluirForm({ estado_conservacao: 'bom', observacoes: '' });
                      setConcluirModalOpen(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Concluir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipamentos com estado crítico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Equipamentos com Estado Regular ou Crítico
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {todosEquipamentos.filter(e => e.estado_conservacao === 'regular' || e.estado_conservacao === 'necessita_manutencao').length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Nenhum equipamento com estado crítico
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todosEquipamentos
                .filter(e => e.estado_conservacao === 'regular' || e.estado_conservacao === 'necessita_manutencao')
                .map(equip => (
                  <div key={equip.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="font-medium text-sm">{equip.codigo} — {equip.tipo_nome}</p>
                        <Badge className={equip.estado_conservacao === 'necessita_manutencao' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                          {equip.estado_conservacao === 'necessita_manutencao' ? 'Necessita Manutenção' : 'Regular'}
                        </Badge>
                      </div>
                    </div>
                    {equip.status !== 'manutencao' && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        await base44.entities.Equipamento.update(equip.id, { status: 'manutencao' });
                        await loadData();
                      }}>
                        Enviar
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Enviar para Manutenção */}
      <Dialog open={enviarModalOpen} onOpenChange={setEnviarModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar para Manutenção</DialogTitle>
            <DialogDescription>Selecione o equipamento e informe o motivo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Equipamento *</Label>
              <Select value={formData.equipamento_id} onValueChange={v => setFormData({ ...formData, equipamento_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o equipamento" /></SelectTrigger>
                <SelectContent>
                  {disponivelParaEnvio.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.codigo} — {e.tipo_nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Prevista de Retorno</Label>
              <Input type="date" value={formData.data_prevista} onChange={e => setFormData({ ...formData, data_prevista: e.target.value })} />
            </div>
            <div>
              <Label>Motivo / Descrição do Problema</Label>
              <Textarea value={formData.motivo} onChange={e => setFormData({ ...formData, motivo: e.target.value })} placeholder="Descreva o problema ou motivo da manutenção..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnviarModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleEnviar} disabled={saving || !formData.equipamento_id} className="bg-yellow-600 hover:bg-yellow-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar para Manutenção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Concluir Manutenção */}
      <Dialog open={concluirModalOpen} onOpenChange={setConcluirModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir Manutenção</DialogTitle>
            <DialogDescription>{selectedEquipamento?.codigo} — {selectedEquipamento?.tipo_nome}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Estado após manutenção</Label>
              <Select value={concluirForm.estado_conservacao} onValueChange={v => setConcluirForm({ ...concluirForm, estado_conservacao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo (Restaurado)</SelectItem>
                  <SelectItem value="bom">Bom</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Relatório da Manutenção</Label>
              <Textarea value={concluirForm.observacoes} onChange={e => setConcluirForm({ ...concluirForm, observacoes: e.target.value })} placeholder="Descreva o que foi feito..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConcluirModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConcluir} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Conclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
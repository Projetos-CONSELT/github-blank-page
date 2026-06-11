import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Users, 
  Package, 
  FileText, 
  Truck, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPessoas: 0,
    totalEquipamentos: 0,
    equipamentosDisponiveis: 0,
    solicitacoesNovas: 0,
    solicitacoesEmTriagem: 0,
    solicitacoesEmFila: 0,
    emprestimosAtivos: 0,
    emprestimosVencendo: 0,
    emprestimosVencidos: 0,
  });
  const [recentSolicitacoes, setRecentSolicitacoes] = useState([]);
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pessoas, equipamentos, solicitacoes, emprestimos] = await Promise.all([
        base44.entities.Pessoa.list(),
        base44.entities.Equipamento.list(),
        base44.entities.Solicitacao.list('-created_date', 100),
        base44.entities.Emprestimo.list('-created_date', 100),
      ]);

      const today = moment();
      const in7Days = moment().add(7, 'days');

      const emprestimosVencendo = emprestimos.filter(e => {
        if (e.status === 'devolvido' || e.status === 'comprado') return false;
        const devolucao = moment(e.data_prevista_devolucao);
        return devolucao.isAfter(today) && devolucao.isBefore(in7Days);
      });

      const emprestimosVencidos = emprestimos.filter(e => {
        if (e.status === 'devolvido' || e.status === 'comprado') return false;
        return moment(e.data_prevista_devolucao).isBefore(today);
      });

      const alerts = [];
      
      if (emprestimosVencidos.length > 0) {
        alerts.push({
          type: 'error',
          icon: XCircle,
          title: `${emprestimosVencidos.length} empréstimo(s) vencido(s)`,
          description: 'Necessitam ação imediata'
        });
      }
      
      if (emprestimosVencendo.length > 0) {
        alerts.push({
          type: 'warning',
          icon: Clock,
          title: `${emprestimosVencendo.length} empréstimo(s) vencendo`,
          description: 'Nos próximos 7 dias'
        });
      }

      const solicitacoesPendentes = solicitacoes.filter(s => s.status === 'pendente_documentos');
      if (solicitacoesPendentes.length > 0) {
        alerts.push({
          type: 'info',
          icon: FileText,
          title: `${solicitacoesPendentes.length} solicitação(ões) aguardando documentos`,
          description: 'Pendências de documentação'
        });
      }

      setStats({
        totalPessoas: pessoas.length,
        totalEquipamentos: equipamentos.length,
        equipamentosDisponiveis: equipamentos.filter(e => e.status === 'disponivel').length,
        solicitacoesNovas: solicitacoes.filter(s => s.status === 'nova').length,
        solicitacoesEmTriagem: solicitacoes.filter(s => s.status === 'em_triagem').length,
        solicitacoesEmFila: solicitacoes.filter(s => s.status === 'em_fila').length,
        emprestimosAtivos: emprestimos.filter(e => e.status === 'ativo' || e.status === 'vencendo' || e.status === 'vencido').length,
        emprestimosVencendo: emprestimosVencendo.length,
        emprestimosVencidos: emprestimosVencidos.length,
      });

      setRecentSolicitacoes(solicitacoes.slice(0, 5));
      setAlertas(alerts);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      nova: { label: 'Nova', variant: 'default', className: 'bg-blue-100 text-blue-700' },
      em_triagem: { label: 'Em Triagem', variant: 'secondary', className: 'bg-yellow-100 text-yellow-700' },
      pendente_documentos: { label: 'Pendente', variant: 'outline', className: 'bg-orange-100 text-orange-700' },
      em_fila: { label: 'Em Fila', variant: 'secondary', className: 'bg-purple-100 text-purple-700' },
      reservado: { label: 'Reservado', variant: 'default', className: 'bg-cyan-100 text-cyan-700' },
      liberado_retirada: { label: 'Liberado', variant: 'default', className: 'bg-green-100 text-green-700' },
      concluida: { label: 'Concluída', variant: 'default', className: 'bg-emerald-100 text-emerald-700' },
      cancelada: { label: 'Cancelada', variant: 'destructive', className: 'bg-red-100 text-red-700' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alertas.map((alerta, index) => (
            <Card key={index} className={`border-l-4 ${
              alerta.type === 'error' ? 'border-l-red-500 bg-red-50/50' :
              alerta.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50/50' :
              'border-l-blue-500 bg-blue-50/50'
            }`}>
              <CardContent className="p-4 flex items-start gap-3">
                <alerta.icon className={`w-5 h-5 mt-0.5 ${
                  alerta.type === 'error' ? 'text-red-500' :
                  alerta.type === 'warning' ? 'text-yellow-500' :
                  'text-blue-500'
                }`} />
                <div>
                  <p className="font-medium text-slate-900">{alerta.title}</p>
                  <p className="text-sm text-slate-600">{alerta.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPIs principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Solicitações Novas</p>
                <p className="text-4xl font-bold mt-1">{stats.solicitacoesNovas}</p>
                <p className="text-blue-100 text-sm mt-2">
                  +{stats.solicitacoesEmTriagem} em triagem
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Empréstimos Ativos</p>
                <p className="text-4xl font-bold mt-1">{stats.emprestimosAtivos}</p>
                <p className="text-emerald-100 text-sm mt-2">
                  {stats.emprestimosVencendo} vencendo em breve
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Truck className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0 shadow-lg shadow-violet-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">Equipamentos</p>
                <p className="text-4xl font-bold mt-1">{stats.totalEquipamentos}</p>
                <p className="text-violet-100 text-sm mt-2">
                  {stats.equipamentosDisponiveis} disponíveis
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Package className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg shadow-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Pessoas Cadastradas</p>
                <p className="text-4xl font-bold mt-1">{stats.totalPessoas}</p>
                <p className="text-amber-100 text-sm mt-2">
                  {stats.solicitacoesEmFila} em fila
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas e Solicitações recentes */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ações Rápidas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às principais funções</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to={createPageUrl('Pessoas') + '?action=new'}>
              <Button className="w-full justify-start gap-3 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                Nova Pessoa
              </Button>
            </Link>
            <Link to={createPageUrl('Equipamentos') + '?action=new'}>
              <Button className="w-full justify-start gap-3 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-emerald-600" />
                </div>
                Novo Equipamento
              </Button>
            </Link>
            <Link to={createPageUrl('Emprestimos') + '?action=entrega'}>
              <Button className="w-full justify-start gap-3 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-violet-600" />
                </div>
                Registrar Entrega
              </Button>
            </Link>
            <Link to={createPageUrl('Emprestimos') + '?action=devolucao'}>
              <Button className="w-full justify-start gap-3 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                </div>
                Registrar Devolução
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Solicitações Recentes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Solicitações Recentes</CardTitle>
              <CardDescription>Últimas solicitações recebidas</CardDescription>
            </div>
            <Link to={createPageUrl('Solicitacoes')}>
              <Button variant="outline" size="sm" className="gap-2">
                Ver todas
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentSolicitacoes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma solicitação encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSolicitacoes.map((solicitacao) => (
                  <Link 
                    key={solicitacao.id} 
                    to={createPageUrl('Solicitacoes') + `?id=${solicitacao.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          #{solicitacao.protocolo}
                        </p>
                        <p className="text-sm text-slate-500">
                          {solicitacao.responsavel_nome || 'Responsável não informado'} • {solicitacao.tipo_equipamento_nome || 'Equipamento'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(solicitacao.status)}
                      <p className="text-xs text-slate-400 mt-1">
                        {moment(solicitacao.created_date).fromNow()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Disponibilidade de Estoque</CardTitle>
          <CardDescription>Visão geral da disponibilidade dos equipamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Equipamentos disponíveis</span>
              <span className="font-semibold">{stats.equipamentosDisponiveis} de {stats.totalEquipamentos}</span>
            </div>
            <Progress 
              value={stats.totalEquipamentos > 0 ? (stats.equipamentosDisponiveis / stats.totalEquipamentos) * 100 : 0} 
              className="h-3"
            />
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 rounded-xl bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-600">{stats.equipamentosDisponiveis}</p>
                <p className="text-sm text-emerald-700">Disponíveis</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-blue-50">
                <p className="text-2xl font-bold text-blue-600">{stats.emprestimosAtivos}</p>
                <p className="text-sm text-blue-700">Emprestados</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-red-50">
                <p className="text-2xl font-bold text-red-600">{stats.emprestimosVencidos}</p>
                <p className="text-sm text-red-700">Vencidos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  BarChart3,
  TrendingUp,
  Package,
  Users,
  Clock,
  AlertTriangle,
  Download,
  Calendar,
  Loader2,
  FileText,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30');
  const [data, setData] = useState({
    solicitacoes: [],
    emprestimos: [],
    equipamentos: [],
    pessoas: [],
    tiposEquipamento: [],
  });

  useEffect(() => {
    loadData();
  }, [periodo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [solicitacoes, emprestimos, equipamentos, pessoas, tipos] = await Promise.all([
        base44.entities.Solicitacao.list('-created_date', 500),
        base44.entities.Emprestimo.list('-created_date', 500),
        base44.entities.Equipamento.list(),
        base44.entities.Pessoa.list(),
        base44.entities.TipoEquipamento.list(),
      ]);

      setData({
        solicitacoes,
        emprestimos,
        equipamentos,
        pessoas,
        tiposEquipamento: tipos,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar dados por período
  const dataInicio = moment().subtract(parseInt(periodo), 'days');
  const solicitacoesFiltradas = data.solicitacoes.filter(s => moment(s.created_date).isAfter(dataInicio));
  const emprestimosFiltrados = data.emprestimos.filter(e => moment(e.created_date).isAfter(dataInicio));

  // Métricas gerais
  const totalSolicitacoes = solicitacoesFiltradas.length;
  const totalEmprestimos = emprestimosFiltrados.length;
  const taxaConclusao = totalSolicitacoes > 0 
    ? Math.round((solicitacoesFiltradas.filter(s => s.status === 'concluida').length / totalSolicitacoes) * 100)
    : 0;
  
  const emprestimosVencidos = data.emprestimos.filter(e => 
    e.status !== 'devolvido' && e.status !== 'comprado' && 
    moment(e.data_prevista_devolucao).isBefore(moment())
  ).length;

  // Dados para gráficos
  const solicitacoesPorStatus = [
    { name: 'Nova', value: solicitacoesFiltradas.filter(s => s.status === 'nova').length },
    { name: 'Em Triagem', value: solicitacoesFiltradas.filter(s => s.status === 'em_triagem').length },
    { name: 'Em Fila', value: solicitacoesFiltradas.filter(s => s.status === 'em_fila').length },
    { name: 'Concluída', value: solicitacoesFiltradas.filter(s => s.status === 'concluida').length },
    { name: 'Cancelada', value: solicitacoesFiltradas.filter(s => s.status === 'cancelada').length },
  ].filter(item => item.value > 0);

  const equipamentosPorStatus = [
    { name: 'Disponível', value: data.equipamentos.filter(e => e.status === 'disponivel').length },
    { name: 'Emprestado', value: data.equipamentos.filter(e => e.status === 'emprestado').length },
    { name: 'Reservado', value: data.equipamentos.filter(e => e.status === 'reservado').length },
    { name: 'Manutenção', value: data.equipamentos.filter(e => e.status === 'manutencao').length },
  ].filter(item => item.value > 0);

  // Itens mais solicitados
  const itensMaisSolicitados = data.tiposEquipamento.map(tipo => ({
    nome: tipo.nome,
    quantidade: solicitacoesFiltradas.filter(s => s.tipo_equipamento_id === tipo.id).length,
  })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

  // Solicitações por dia (últimos 30 dias)
  const solicitacoesPorDia = [];
  for (let i = 29; i >= 0; i--) {
    const dia = moment().subtract(i, 'days');
    solicitacoesPorDia.push({
      dia: dia.format('DD/MM'),
      quantidade: data.solicitacoes.filter(s => moment(s.created_date).isSame(dia, 'day')).length,
    });
  }

  // Empréstimos inadimplentes
  const inadimplentes = data.emprestimos.filter(e => 
    e.status !== 'devolvido' && e.status !== 'comprado' && 
    moment(e.data_prevista_devolucao).isBefore(moment())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Relatórios Gerenciais</h2>
          <p className="text-sm text-slate-500">Visão geral das operações do clube</p>
        </div>
        <div className="flex gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Solicitações</p>
                <p className="text-2xl font-bold text-blue-600">{totalSolicitacoes}</p>
                <p className="text-xs text-slate-400">no período</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Empréstimos</p>
                <p className="text-2xl font-bold text-emerald-600">{totalEmprestimos}</p>
                <p className="text-xs text-slate-400">no período</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-violet-600">{taxaConclusao}%</p>
                <p className="text-xs text-slate-400">solicitações</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Inadimplentes</p>
                <p className="text-2xl font-bold text-red-600">{emprestimosVencidos}</p>
                <p className="text-xs text-slate-400">empréstimos</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="inadimplencia">Inadimplência</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          {/* Gráficos lado a lado */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Solicitações por Status</CardTitle>
              </CardHeader>
              <CardContent>
                {solicitacoesPorStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={solicitacoesPorStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {solicitacoesPorStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    Sem dados no período
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Equipamentos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                {equipamentosPorStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={equipamentosPorStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {equipamentosPorStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    Sem dados
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Itens mais solicitados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Itens Mais Solicitados</CardTitle>
            </CardHeader>
            <CardContent>
              {itensMaisSolicitados.length > 0 && itensMaisSolicitados[0].quantidade > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={itensMaisSolicitados} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nome" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  Sem dados no período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solicitacoes" className="space-y-6">
          {/* Evolução de Solicitações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução de Solicitações (Últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={solicitacoesPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="quantidade" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabela de Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { status: 'Nova', count: solicitacoesFiltradas.filter(s => s.status === 'nova').length, color: 'bg-blue-100 text-blue-700' },
                  { status: 'Em Triagem', count: solicitacoesFiltradas.filter(s => s.status === 'em_triagem').length, color: 'bg-yellow-100 text-yellow-700' },
                  { status: 'Pendente Documentos', count: solicitacoesFiltradas.filter(s => s.status === 'pendente_documentos').length, color: 'bg-orange-100 text-orange-700' },
                  { status: 'Em Fila', count: solicitacoesFiltradas.filter(s => s.status === 'em_fila').length, color: 'bg-purple-100 text-purple-700' },
                  { status: 'Reservado', count: solicitacoesFiltradas.filter(s => s.status === 'reservado').length, color: 'bg-cyan-100 text-cyan-700' },
                  { status: 'Concluída', count: solicitacoesFiltradas.filter(s => s.status === 'concluida').length, color: 'bg-emerald-100 text-emerald-700' },
                  { status: 'Cancelada', count: solicitacoesFiltradas.filter(s => s.status === 'cancelada').length, color: 'bg-red-100 text-red-700' },
                ].map((item) => (
                  <div key={item.status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={item.color}>{item.status}</Badge>
                    </div>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-6">
          {/* Estoque por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estoque por Tipo de Equipamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.tiposEquipamento.map(tipo => {
                  const total = data.equipamentos.filter(e => e.tipo_id === tipo.id).length;
                  const disponivel = data.equipamentos.filter(e => e.tipo_id === tipo.id && e.status === 'disponivel').length;
                  const emprestado = data.equipamentos.filter(e => e.tipo_id === tipo.id && e.status === 'emprestado').length;
                  
                  return (
                    <div key={tipo.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{tipo.nome}</p>
                        <p className="text-sm text-slate-500">{total} unidades</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Disponíveis: {disponivel}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Emprestados: {emprestado}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {data.tiposEquipamento.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    Nenhum tipo de equipamento cadastrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inadimplencia" className="space-y-6">
          {/* Lista de Inadimplentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Empréstimos Vencidos ({inadimplentes.length})
              </CardTitle>
              <CardDescription>
                Lista de empréstimos com devolução atrasada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inadimplentes.length > 0 ? (
                <div className="space-y-3">
                  {inadimplentes.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">{emp.pessoa_nome}</p>
                        <p className="text-sm text-slate-600">
                          {emp.equipamento_codigo} - {emp.tipo_equipamento_nome}
                        </p>
                        <p className="text-sm text-red-600">
                          Vencido em: {moment(emp.data_prevista_devolucao).format('DD/MM/YYYY')}
                          {' '}({moment(emp.data_prevista_devolucao).fromNow()})
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-700">
                        {Math.abs(moment(emp.data_prevista_devolucao).diff(moment(), 'days'))} dias
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-50" />
                  <p>Nenhum empréstimo vencido</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminAuth from './pages/AdminAuth';
import AdminDashboard from './pages/AdminDashboard';
import AdminSecurityCenter from './pages/AdminSecurityCenter';
import BridgeAlzTest from './pages/BridgeAlzTest';
import ClasseDetalhe from './pages/ClasseDetalhe';
import DungeonDetalhe from './pages/DungeonDetalhe';
import Enquetes from './pages/Enquetes';
import EnquetesExport from './pages/EnquetesExport';
import Entrar from './pages/Entrar';
import GuildaDetalhe from './pages/GuildaDetalhe';
import Guildas from './pages/Guildas';
import GuildasExport from './pages/GuildasExport';
import Home from './pages/Home';
import HomeExport from './pages/HomeExport';
import HomeNevareth from './pages/HomeNevareth';
import Loja from './pages/Loja';
import LojaExport from './pages/LojaExport';
import Mercado from './pages/Mercado';
import MercadoAlz from './pages/MercadoAlz';
import MercadoAlzComprar from './pages/MercadoAlzComprar';
import MercadoAlzVender from './pages/MercadoAlzVender';
import MercadoAnunciar from './pages/MercadoAnunciar';
import MercadoMinhasCompras from './pages/MercadoMinhasCompras';
import MercadoMinhasOfertas from './pages/MercadoMinhasOfertas';
import MercadoPedido from './pages/MercadoPedido';
import MercadoServicos from './pages/MercadoServicos';
import MercadoServicosContrato from './pages/MercadoServicosContrato';
import MercadoServicosContratos from './pages/MercadoServicosContratos';
import MercadoServicosMinhasOfertas from './pages/MercadoServicosMinhasOfertas';
import MercadoServicosOferta from './pages/MercadoServicosOferta';
import MercadoTermos from './pages/MercadoTermos';
import MinhaConta from './pages/MinhaConta';
import MinhaContaAcessos from './pages/MinhaContaAcessos';
import MinhaContaAlterarSenha from './pages/MinhaContaAlterarSenha';
import MinhaContaCaixasExtensor from './pages/MinhaContaCaixasExtensor';
import MinhaContaCaixasInsignias from './pages/MinhaContaCaixasInsignias';
import MinhaContaCarteira from './pages/MinhaContaCarteira';
import MinhaContaDoacao from './pages/MinhaContaDoacao';
import MinhaContaExtensores from './pages/MinhaContaExtensores';
import MinhaContaInsignias from './pages/MinhaContaInsignias';
import MinhaContaLoja from './pages/MinhaContaLoja';
import MinhaContaPedidosAlz from './pages/MinhaContaPedidosAlz';
import MinhaContaPremium from './pages/MinhaContaPremium';
import MinhaContaTransferencias from './pages/MinhaContaTransferencias';
import NotFound from './pages/NotFound';
import Painel from './pages/Painel';
import PedidoAlzDetalhe from './pages/PedidoAlzDetalhe';
import PersonagemDetalhe from './pages/PersonagemDetalhe';
import PoliticaDePrivacidade from './pages/PoliticaDePrivacidade';
import Ranking from './pages/Ranking';
import RankingCorredores from './pages/RankingCorredores';
import RankingMatadorSemanal from './pages/RankingMatadorSemanal';
import RecuperarSenha from './pages/RecuperarSenha';
import Registrar from './pages/Registrar';
import Suporte from './pages/Suporte';
import TGAoVivo from './pages/TGAoVivo';
import TermosDeUso from './pages/TermosDeUso';
import TermosMarketplaceAlz from './pages/TermosMarketplaceAlz';
import VenderAlz from './pages/VenderAlz';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAuth": AdminAuth,
    "AdminDashboard": AdminDashboard,
    "AdminSecurityCenter": AdminSecurityCenter,
    "BridgeAlzTest": BridgeAlzTest,
    "ClasseDetalhe": ClasseDetalhe,
    "DungeonDetalhe": DungeonDetalhe,
    "Enquetes": Enquetes,
    "EnquetesExport": EnquetesExport,
    "Entrar": Entrar,
    "GuildaDetalhe": GuildaDetalhe,
    "Guildas": Guildas,
    "GuildasExport": GuildasExport,
    "Home": Home,
    "HomeExport": HomeExport,
    "HomeNevareth": HomeNevareth,
    "Loja": Loja,
    "LojaExport": LojaExport,
    "Mercado": Mercado,
    "MercadoAlz": MercadoAlz,
    "MercadoAlzComprar": MercadoAlzComprar,
    "MercadoAlzVender": MercadoAlzVender,
    "MercadoAnunciar": MercadoAnunciar,
    "MercadoMinhasCompras": MercadoMinhasCompras,
    "MercadoMinhasOfertas": MercadoMinhasOfertas,
    "MercadoPedido": MercadoPedido,
    "MercadoServicos": MercadoServicos,
    "MercadoServicosContrato": MercadoServicosContrato,
    "MercadoServicosContratos": MercadoServicosContratos,
    "MercadoServicosMinhasOfertas": MercadoServicosMinhasOfertas,
    "MercadoServicosOferta": MercadoServicosOferta,
    "MercadoTermos": MercadoTermos,
    "MinhaConta": MinhaConta,
    "MinhaContaAcessos": MinhaContaAcessos,
    "MinhaContaAlterarSenha": MinhaContaAlterarSenha,
    "MinhaContaCaixasExtensor": MinhaContaCaixasExtensor,
    "MinhaContaCaixasInsignias": MinhaContaCaixasInsignias,
    "MinhaContaCarteira": MinhaContaCarteira,
    "MinhaContaDoacao": MinhaContaDoacao,
    "MinhaContaExtensores": MinhaContaExtensores,
    "MinhaContaInsignias": MinhaContaInsignias,
    "MinhaContaLoja": MinhaContaLoja,
    "MinhaContaPedidosAlz": MinhaContaPedidosAlz,
    "MinhaContaPremium": MinhaContaPremium,
    "MinhaContaTransferencias": MinhaContaTransferencias,
    "NotFound": NotFound,
    "Painel": Painel,
    "PedidoAlzDetalhe": PedidoAlzDetalhe,
    "PersonagemDetalhe": PersonagemDetalhe,
    "PoliticaDePrivacidade": PoliticaDePrivacidade,
    "Ranking": Ranking,
    "RankingCorredores": RankingCorredores,
    "RankingMatadorSemanal": RankingMatadorSemanal,
    "RecuperarSenha": RecuperarSenha,
    "Registrar": Registrar,
    "Suporte": Suporte,
    "TGAoVivo": TGAoVivo,
    "TermosDeUso": TermosDeUso,
    "TermosMarketplaceAlz": TermosMarketplaceAlz,
    "VenderAlz": VenderAlz,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
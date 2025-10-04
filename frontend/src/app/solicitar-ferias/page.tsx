import SolicitarFerias from "../../../components/solicitacao_ferias";
import Header from "../../../components/Header";

const SolicitarFeriasPage = () => {
    return (
        <div className="Ferias">
            <div className="min-h-screen align-items bg-gray-500">
                <SolicitarFerias /> {/* Chama o componente correto */}
            </div>
        </div>
    );
};

export default SolicitarFeriasPage;


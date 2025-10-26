import { NextPage } from "next";

interface ErrorProps {
    statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
    return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
            <h1>
                {statusCode
                    ? `An error ${statusCode} occurred on server`
                    : "An error occurred on client"}
            </h1>
        </div>
    );
};

Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default Error;


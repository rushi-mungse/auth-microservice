import app from "./app";
import { PORT, logger, AppDataSource } from "./config";

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        logger.info("Database connected successfully!");
        app.listen(PORT, () => {
            logger.info(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        if (error instanceof Error) logger.error(error.message);
        else logger.error("Internal Server Error");
    }
};

void startServer();

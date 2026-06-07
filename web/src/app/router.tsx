import { createBrowserRouter } from "react-router-dom";

import { App } from "./App";
import { DashboardPage } from "../features/dashboard/page";
import { HistoryPage } from "../features/history/page";
import { ImageRecognitionPage } from "../features/image-recognition/page";
import { MuseumVisionPage } from "../features/museum-vision/page";
import { SentimentAnalysisPage } from "../features/sentiment-analysis/page";
import { TextGenerationPage } from "../features/text-generation/page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "image-recognition",
        element: <ImageRecognitionPage />,
      },
      {
        path: "sentiment-analysis",
        element: <SentimentAnalysisPage />,
      },
      {
        path: "text-generation",
        element: <TextGenerationPage />,
      },
      {
        path: "museum-vision",
        element: <MuseumVisionPage />,
      },
      {
        path: "history",
        element: <HistoryPage />,
      },
    ],
  },
]);

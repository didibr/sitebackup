#include <iostream>
#include <stdio.h>
#include <string>
#include <sstream>
#include <filesystem>
#include <set>
#include <cmath>
#include <algorithm>
#include "LuxandFaceSDK.h"

int frameMax = 20;
float angleLeft = -5;
float angleRight = 10;
namespace fs = std::filesystem;
bool livenessCheck(std::string folderPath, std::string folderID);
bool templateCheck(std::string folderPath, std::string folderID);
bool challengecheck(std::string folderPath, std::string folderID, int challengeN);
void averagePitchYaw(std::string folderPath, std::string folderID);
bool challengecheck_single(std::string folderPath, std::string folderID, int challengeN);


int main(int argc, char **argv)
{
    if (argc < 3)
    {
        std::cout << "❌ Uso: ./programa <ID>" << std::endl;
        return 1;
    }
    std::string folderID = argv[2];
    std::string CMD = argv[1];
    std::string folderPath = "../capturas/" + folderID + "/";
    const std::string licenseKey = "HpYQSPxnv1/t3i2MSYJM4jbAF70h1a0BhTmdh+irLaGhKhyIb5g4bqYY7zCZf01IoAqZ+mawfFoncLf7VfxxLn453HuHb38SRTk1yMTMQ2RoAnrXi7ZG01IEWv9Ix6LL+KD6kdVG6JRMuFvaV2yfYp+ntEiCYP8K9bkEKbAaA/s=";
    if (FSDK_ActivateLibrary((char *)licenseKey.c_str()) != 0)
    {
        std::cout << "❌ Chave inválida" << std::endl;
        return 1;
    }
    if (FSDK_Initialize((char *)".") != FSDKE_OK)
    {
        std::cout << "❌ Erro ao inicializar o FaceSDK" << std::endl;
        return 1;
    }
    char licenseInfo[1024];
    if (FSDK_GetLicenseInfo(licenseInfo) == FSDKE_OK)
    {
        // std::cout << "📄 Licença: " << licenseInfo << std::endl;
    }
    if (CMD == "LIVNESS")
    {
        livenessCheck(folderPath, folderID);
    }
    if (CMD == "TEMPLATECHECK")
    {
        templateCheck(folderPath, folderID);
    }
    if(CMD == "GETPITCH"){
        averagePitchYaw(folderPath, folderID);
    }
    if (CMD.rfind("CHALLENGE", 0) == 0)
    {                                       // começa com "CHALLENGE"
        int num = std::stoi(CMD.substr(9)); // pega substring após "CHALLENGE"
        if (num >= 1 && num <= 4)
        {
            challengecheck(folderPath, folderID, num);
        }
        else
        {
            std::cout << "Numero do desafio invalido" << std::endl;            
        }
    }

    if (CMD.rfind("2CHALLENGE", 0) == 0)
    {               // começa com "CHALLENGE"
        int num = std::stoi(CMD.substr(10)); // pega substring após "CHALLENGE"
        if (num >= 1 && num <= 4)
        {
            challengecheck_single(folderPath, folderID, num);
        }
        else
        {
            std::cout << "Numero do desafio invalido" << std::endl;            
        }
    }

    FSDK_Finalize();
    return 0;
}

bool saveTemplate(HImage image, const std::string &folderID)
{
    FSDK_FaceTemplate ft;
    std::string templatePath = "../capturas/" + folderID + ".bin";
    bool success = false;
    if (FSDK_GetFaceTemplate(image, &ft) == FSDKE_OK)
    {
        FILE *f = fopen(templatePath.c_str(), "wb");
        if (f)
        {
            fwrite(&ft, sizeof(FSDK_FaceTemplate), 1, f);
            fclose(f);
            // printf("Template salvo com sucesso.\n");
            success = true;
        }
        else
        {
            // printf("Erro ao abrir o arquivo para salvar o template.\n");
        }
    }
    else
    {
        // printf("Não foi possível obter o template.\n");
    }
    FSDK_FreeImage(image);
    return success;
}

float compareTemplates(const std::string &templatePath, HImage image)
{
    // Carregar o template salvo
    FSDK_FaceTemplate savedTemplate;
    FILE *file = fopen(templatePath.c_str(), "rb");
    float similarity = 0.0f;
    if (file)
    {
        fread(&savedTemplate, sizeof(FSDK_FaceTemplate), 1, file);
        fclose(file);
    }
    // Obter o template da imagem atual
    FSDK_FaceTemplate currentTemplate;
    if (FSDK_GetFaceTemplate(image, &currentTemplate) == FSDKE_OK)
    {
        // Comparar os dois templates
        int res = FSDK_MatchFaces(&savedTemplate, &currentTemplate, &similarity);
        if (res != FSDKE_OK)
        {
            // printf("Erro ao comparar templates.\n");
            similarity = 0.0f;
        }
    }
    // Libera a imagem processada
    FSDK_FreeImage(image);
    // Retorna sucesso
    return similarity;
}


void averagePitchYaw(std::string folderPath, std::string folderID)
{
    HTracker tracker = 0;
    FSDK_CreateTracker(&tracker);
    int err = 0;
    FSDK_SetTrackerMultipleParameters(tracker,
                                      "HandleArbitraryRotations=true;"
                                      "DetermineFaceRotationAngle=false;"
                                      "InternalResizeWidth=256;"
                                      "FaceDetectionThreshold=5;",
                                      &err);
    long long IDs[256];
    long long faceCount = 0;

    float yawSum = 0.0f;
    float pitchSum = 0.0f;
    int validFrames = 0;

    for (int i = 1; i <= frameMax; ++i)
    {
        std::stringstream imagePathStream;
        imagePathStream << folderPath << i << ".jpg";
        std::string imagePath = imagePathStream.str();
        HImage image;
        if (FSDK_LoadImageFromFile(&image, imagePath.c_str()) != FSDKE_OK)
            continue;

        FSDK_FeedFrame(tracker, 0, image, &faceCount, IDs, sizeof(IDs));
        if (faceCount == 1)
        {
            FSDK_Features f;
            if (FSDK_GetTrackerFacialFeatures(tracker, 0, IDs[0], &f) == FSDKE_OK)
            {
                // Calcular YAW
                float yaw = 0.0f;
                float eyesCenterX = (f[0].x + f[1].x) / 2.0f;
                float eyeDistX = std::abs(f[1].x - f[0].x);
                if (eyeDistX > 1.0f)
                {
                    float dx = f[2].x - eyesCenterX;
                    float yawRatio = dx / eyeDistX;
                    yaw = std::clamp(yawRatio * 30.0f, -30.0f, 30.0f);
                }

                // Calcular PITCH
                float pitch = 0.0f;
                float eyesCenterY = (f[0].y + f[1].y) / 2.0f;
                float eyeDist = std::sqrt(std::pow(f[1].x - f[0].x, 2) + std::pow(f[1].y - f[0].y, 2));
                if (eyeDist > 1.0f)
                {
                    float dy = f[2].y - eyesCenterY;
                    float pitchRatio = dy / eyeDist;
                    if (pitchRatio < 0)
                        pitchRatio *= 1.8f;
                    else
                        pitchRatio *= 0.9f;
                    pitch = std::clamp(pitchRatio * 30.0f, -30.0f, 30.0f);
                }

                yawSum += yaw;
                pitchSum += pitch;
                validFrames++;
            }
        }
        FSDK_FreeImage(image);
    }

    if (validFrames > 0)
    {
        float averageYaw = yawSum / validFrames;//lados
        float averagePitch = pitchSum / validFrames;//cima baixo
        std::cout <<  averageYaw << ":" << averagePitch << std::endl;        
    }
    else
    {
        std::cout << "99:99" << std::endl; //ERROR
    }

    FSDK_FreeTracker(tracker);
}


bool livenessCheck(std::string folderPath, std::string folderID)
{
    HTracker tracker = 0;
    FSDK_CreateTracker(&tracker);
    int err = 0;
    FSDK_SetTrackerMultipleParameters(tracker,
                                      "HandleArbitraryRotations=true;"
                                      "DetermineFaceRotationAngle=true;"
                                      "InternalResizeWidth=256;"
                                      "FaceDetectionThreshold=5;",
                                      &err);
    FSDK_SetTrackerParameter(tracker, "DetectLiveness", "true");
    FSDK_SetTrackerParameter(tracker, "SmoothAttributeLiveness", "true");
    FSDK_SetTrackerParameter(tracker, "AttributeLivenessSmoothingAlpha", "1");
    FSDK_SetTrackerParameter(tracker, "LivenessFramesCount", "15");
    long long IDs[256];
    long long faceCount = 0;
    HImage lastValidImage = 0;
    std::set<long long> uniqueFaceIDs;
    for (int i = 1; i <= frameMax; ++i)
    {
        std::stringstream imagePathStream;
        imagePathStream << folderPath << i << ".jpg";
        std::string imagePath = imagePathStream.str();
        HImage image;
        if (FSDK_LoadImageFromFile(&image, imagePath.c_str()) != FSDKE_OK)
        {
            continue;
        }
        FSDK_FeedFrame(tracker, 0, image, &faceCount, IDs, sizeof(IDs));
        // std::cout << "Frame " << i << ": faceCount = " << faceCount << std::endl;
        for (int j = 0; j < faceCount; ++j)
        {
            uniqueFaceIDs.insert(IDs[j]);
        }
        if (faceCount == 1 && lastValidImage == 0)
        {
            lastValidImage = image; // guarda primeira imagem válida
        }
        else
        {
            FSDK_FreeImage(image);
        }
    }
    if (uniqueFaceIDs.size() == 0)
    {
        std::cout << "Rosto nao encontrada ou invalido" << std::endl;
        return false;
    }
    if (uniqueFaceIDs.size() > 1)
    {
        std::cout << "Mais de um rosto detectado" << std::endl;
        return false;
    }
    float liveness = 0.0f;
    long faceID = IDs[0];
    TFacePosition facePosition;
    FSDK_GetTrackerFacePosition(tracker, 0, faceID, &facePosition);
    // std::cout << "Rosto detectado em: X: " << facePosition.xc
    //          << ", Y: " << facePosition.yc
    //           << ", Largura: " << facePosition.w << std::endl;
    char value[1024];
    int res = FSDK_GetTrackerFacialAttribute(tracker, 0, faceID, "Liveness", value, 1024);
    if (res == FSDKE_OK)
    {
        //   std::cout << "Atributes" << std::endl;
        res = FSDK_GetValueConfidence(value, "Liveness", &liveness);
    }
    if (res != FSDKE_OK)
    {
        std::cout << "Nao foi possivel determinar liveness" << std::endl;
        return false;
    }
    else if (liveness > 0.5f && liveness != 1.0f)
    {
        if (!saveTemplate(lastValidImage, folderID))
        {
            std::cout << "Erro ao salvar o template apos liveness" << std::endl;
            return false;
        }
        std::cout << "Liveness check passed" << std::endl;
        return true;
    }
    else
    {
        std::cout << "Liveness check failed" << std::endl;
        return false;
    }
    return false;
}

bool challengecheck(std::string folderPath, std::string folderID, int challengeN)
{
    HTracker tracker = 0;
    FSDK_CreateTracker(&tracker);
    int err = 0;
    FSDK_SetTrackerMultipleParameters(tracker,
                                      "HandleArbitraryRotations=true;"
                                      "DetermineFaceRotationAngle=false;"
                                      "InternalResizeWidth=256;"
                                      "FaceDetectionThreshold=5;",
                                      &err);
    long long IDs[256];
    long long faceCount = 0;
    float angleSum = 0.0f;
    int validFrames = 0;
    for (int i = 1; i <= frameMax; ++i)
    {
        std::stringstream imagePathStream;
        imagePathStream << folderPath << i << ".jpg";
        std::string imagePath = imagePathStream.str();
        HImage image;
        if (FSDK_LoadImageFromFile(&image, imagePath.c_str()) != FSDKE_OK)
            continue;
        FSDK_FeedFrame(tracker, 0, image, &faceCount, IDs, sizeof(IDs));
        if (faceCount == 1)
        {
            FSDK_Features f;
            if (FSDK_GetTrackerFacialFeatures(tracker, 0, IDs[0], &f) == FSDKE_OK)
            {
                float angle = 0.0f;
                if (challengeN == 1 || challengeN == 2)
                {
                    // YAW normalizado
                    float eyesCenterX = (f[0].x + f[1].x) / 2.0f;
                    float eyeDist = std::abs(f[1].x - f[0].x);
                    if (eyeDist > 1.0f) // evitar divisão por zero
                    {
                        float dx = f[2].x - eyesCenterX;
                        float yawRatio = dx / eyeDist;
                        angle = std::clamp(yawRatio * 30.0f, -30.0f, 30.0f);
                    }
                }
                else if (challengeN == 3 || challengeN == 4)
                {
                    // PITCH melhorado: compara nariz com linha dos olhos, usando distância dos olhos como base
                    float eyesCenterY = (f[0].y + f[1].y) / 2.0f;
                    float dy = f[2].y - eyesCenterY;
                    float eyeDist = std::sqrt(std::pow(f[1].x - f[0].x, 2) + std::pow(f[1].y - f[0].y, 2));
                    if (eyeDist > 1.0f)
                    {
                        // float pitchRatio = dy / eyeDist;
                        // angle = std::clamp(pitchRatio * 30.0f, -30.0f, 30.0f);
                        float pitchRatio = dy / eyeDist;
                        // Compensação para assimetria da cabeça
                        if (pitchRatio < 0)
                            pitchRatio *= 1.8f; // Amplifica quando olhando para cima
                        else
                            pitchRatio *= 0.9f; // Suaviza levemente para baixo
                        angle = std::clamp(pitchRatio * 30.0f, -30.0f, 30.0f);
                    }
                }
                else
                {
                    // ROLL padrão
                    float dx = f[1].x - f[0].x;
                    float dy = f[1].y - f[0].y;
                    angle = std::atan2(dy, dx) * 180.0f / M_PI;
                }
                angleSum += angle;
                validFrames++;
            }
        }
        FSDK_FreeImage(image);
    }
    if (validFrames == 0)
    {
        std::cout << "Rosto nao encontrada ou invalido" << std::endl;
        return false;
    }
    float averageAngle = angleSum / validFrames;
    if (challengeN == 1 || challengeN == 2)
        std::cout << averageAngle << std::endl;
    else if (challengeN == 3 || challengeN == 4)
        std::cout << averageAngle << std::endl;
    else
        std::cout << "Roll:" << averageAngle << std::endl;
    return true;
}

bool challengecheck_single(std::string folderPath, std::string folderID, int challengeN)
{
    HTracker tracker = 0;
    FSDK_CreateTracker(&tracker);

    int err = 0;
    FSDK_SetTrackerMultipleParameters(tracker,
        "HandleArbitraryRotations=true;"
        "DetermineFaceRotationAngle=false;"
        "InternalResizeWidth=256;"
        "FaceDetectionThreshold=2;",
        &err);

    
    std::string imagePath = folderPath  + "0.jpg";
        
    HImage image;
    if (FSDK_LoadImageFromFile(&image, imagePath.c_str()) != FSDKE_OK) {
        std::cout << "Erro ao carregar imagem" << std::endl;
        return false;
    }

    long long IDs[1];
    long long faceCount = 0;
    //FSDK_FeedFrame(tracker, 0, image, &faceCount, IDs, sizeof(IDs));
    for (int i = 0; i < 6; ++i) {
    FSDK_FeedFrame(tracker, 0, image, &faceCount, IDs, sizeof(IDs));
}

    bool result = false;
    if (faceCount == 1) {
        FSDK_Features f;
        if (FSDK_GetTrackerFacialFeatures(tracker, 0, IDs[0], &f) == FSDKE_OK) {
            float angle = 0.0f;

            if (challengeN == 1 || challengeN == 2) {
                // YAW
                float eyesCenterX = (f[0].x + f[1].x) / 2.0f;
                float eyeDist = std::abs(f[1].x - f[0].x);
                if (eyeDist > 1.0f) {
                    float dx = f[2].x - eyesCenterX;
                    float yawRatio = dx / eyeDist;
                    angle = std::clamp(yawRatio * 30.0f, -30.0f, 30.0f);
                }
            }
            else if (challengeN == 3 || challengeN == 4) {
                // PITCH
                float eyesCenterY = (f[0].y + f[1].y) / 2.0f;
                float dy = f[2].y - eyesCenterY;
                float eyeDist = std::sqrt(std::pow(f[1].x - f[0].x, 2) + std::pow(f[1].y - f[0].y, 2));
                if (eyeDist > 1.0f) {
                    float pitchRatio = dy / eyeDist;
                    if (pitchRatio < 0)
                        pitchRatio *= 1.8f;
                    else
                        pitchRatio *= 0.9f;
                    angle = std::clamp(pitchRatio * 30.0f, -30.0f, 30.0f);
                }
            }
            else {
                // ROLL
                float dx = f[1].x - f[0].x;
                float dy = f[1].y - f[0].y;
                angle = std::atan2(dy, dx) * 180.0f / M_PI;
            }

            // Exibir ângulo
            if (challengeN == 1 || challengeN == 2)
                std::cout <<  angle << std::endl;
            else if (challengeN == 3 || challengeN == 4)
                std::cout <<  angle << std::endl;
            else
                std::cout <<  angle << std::endl;

            result = true;
        }
    } else {
        std::cout << "Rosto nao encontrada ou invalido" << std::endl;
    }

    FSDK_FreeImage(image);
    FSDK_FreeTracker(tracker);
    return result;
}



bool templateCheck(std::string folderPath, std::string folderID)
{
    int err = 0;
    long long IDs[256];
    long long faceCount = 0;
    HImage lastValidImage = 0;
    std::string templatePath = "../capturas/" + folderID + ".bin";
    for (int i = 1; i <= frameMax; ++i)
    {
        std::stringstream imagePathStream;
        imagePathStream << folderPath << i << ".jpg";
        std::string imagePath = imagePathStream.str();
        HImage image;
        if (FSDK_LoadImageFromFile(&image, imagePath.c_str()) != FSDKE_OK)
        {
            continue;
        }
        if (lastValidImage == 0)
        {
            lastValidImage = image; // guarda primeira imagem válida
            break;
        }
        else
        {
            FSDK_FreeImage(image);
        }
    }
    float similarity = compareTemplates(templatePath, lastValidImage);
    std::cout << similarity << std::endl;
    return false;
}
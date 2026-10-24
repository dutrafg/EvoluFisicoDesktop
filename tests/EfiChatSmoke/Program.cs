using EvoluFisico.Desktop;

const string modelId = "qwen35-2b-q4";
try
{
    Console.WriteLine("Installing checksum-pinned Qwen3.5-2B for the real EFI chat smoke.");
    var progress = new Progress<EfiAiModelManager.DownloadProgress>(p =>
    {
        if (p.TotalBytes > 0)
            Console.WriteLine($"Model download: {p.BytesReceived * 100 / p.TotalBytes}%");
    });
    if (!await EfiAiModelManager.InstallAsync(modelId, progress))
        throw new InvalidOperationException("Qwen model installation did not complete.");
    await EfiAiModelManager.SetSelectedAsync(modelId);

    const string context =
        "Contexto EFIA sintético e validado. Quatro avaliações em datas distintas, " +
        "mesmo aluno, período maior que 21 dias. Variação de cintura calculada pelo EF79: -1.50 cm. " +
        "EF78: método comparável. Sem diagnóstico ou prescrição.";
    var history = new[]
    {
        new EfiAiRuntime.ChatMessage("user", "Nesta conversa de teste, o apelido é LAGOA AZUL."),
        new EfiAiRuntime.ChatMessage("assistant", "Entendido; usarei esse apelido apenas como contexto da conversa.")
    };
    var response = await EfiAiRuntime.ChatAsync(
        context, history, "Responda em uma frase: qual a variação de cintura no contexto?");
    if (string.IsNullOrWhiteSpace(response) || response.Length > 8000)
        throw new InvalidDataException("EFI chat returned an empty or oversized response.");

    Console.WriteLine("PASS: real EFI ChatAsync inference with local Qwen3.5-2B, synthetic EFIA facts and prior turns.");
    Console.WriteLine("Response length: " + response.Length);
}
finally
{
    try { await EfiAiModelManager.RemoveAsync(modelId); }
    catch (Exception ex) { Console.WriteLine("Model cleanup warning: " + ex.GetType().Name); }
}

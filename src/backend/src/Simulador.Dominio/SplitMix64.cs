namespace Simulador.Dominio;

/// <summary>
/// Gerador pseudoaleatorio deterministico (SplitMix64) para sorteio reproduzivel de causas e sementes.
/// </summary>
public sealed class SplitMix64
{
    private ulong _state;

    public SplitMix64(long seed)
    {
        _state = unchecked((ulong)seed);
    }

    public ulong NextUInt64()
    {
        _state = unchecked(_state + 0x9E3779B97F4A7C15UL);
        var z = _state;
        z = unchecked((z ^ (z >> 30)) * 0xBF58476D1CE4E5B9UL);
        z = unchecked((z ^ (z >> 27)) * 0x94D049BB133111EBUL);
        return z ^ (z >> 31);
    }

    public int NextInt(int maxExclusive)
    {
        if (maxExclusive <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxExclusive));
        return (int)(NextUInt64() % (ulong)maxExclusive);
    }
}

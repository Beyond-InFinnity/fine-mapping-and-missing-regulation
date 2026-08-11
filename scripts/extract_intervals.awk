# Stream a MetaBrain per-chromosome biogenformat file (uncompressed on stdin)
# and split rows into per-locus files by SNP position.
#
# Usage:
#   zcat chr.txt.gz | awk -v ivf=intervals.tsv -v outdir=DIR -f extract_intervals.awk
#
# intervals.tsv: locus_id <TAB> region_start <TAB> region_end   (no header)
# Column 4 of the input stream is SNPChrPos (verified against the expected
# header by the calling rule before this script runs).
#
# Every locus file is created up-front with the header line, so loci with
# zero overlapping rows still yield a valid (header-only) file rather than
# a missing one.
BEGIN {
    FS = OFS = "\t"
    n = 0
    while ((getline line < ivf) > 0) {
        split(line, a, "\t")
        n++
        id[n] = a[1]; s[n] = a[2] + 0; e[n] = a[3] + 0
    }
    close(ivf)
    if (n == 0) { print "extract_intervals.awk: empty intervals file" > "/dev/stderr"; exit 1 }
}
NR == 1 {
    for (i = 1; i <= n; i++) print $0 > (outdir "/" id[i] ".tsv")
    next
}
{
    p = $4 + 0
    for (i = 1; i <= n; i++)
        if (p >= s[i] && p <= e[i]) print $0 > (outdir "/" id[i] ".tsv")
}
END {
    for (i = 1; i <= n; i++) close(outdir "/" id[i] ".tsv")
}

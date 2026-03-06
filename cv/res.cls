% res.cls
% Resume class file
% Originally from Rensselaer Polytechnic Institute
% http://www.rpi.edu/dept/arc/training/latex/resumes/

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{res}[2004/02/20 v1.4b Resume class]

\newif\ifll
\newif\ifline
\newif\iflmargin
\newif\ifoverlap
\linetrue            % Default is to have a line
\overlapfalse
\lmargintrue         % Default is to use margin format

\DeclareOption{line}{\linetrue}
\DeclareOption{noline}{\linefalse}
\DeclareOption{margin}{\lmargintrue}
\DeclareOption{centered}{\lmarginfalse}
\DeclareOption{overlapped}{\overlaptrue\lmargintrue}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax

\LoadClass[11pt]{article}

\pagestyle{empty}  % No page numbers/headers/footers

\RequirePackage[nohead,nofoot]{geometry}

\newdimen\resumewidth
\newdimen\sectionwidth
\newdimen\sectionskip

\resumewidth=6.5in
\sectionskip=3.5ex plus 1.5ex minus -.2ex
\sectionwidth=1.1in

\geometry{
  top=0.5in,
  bottom=0.5in,
  left=1.0in,
  right=0.75in,
  textwidth=\resumewidth} 

% Section formatting
\renewcommand{\section}[1]{%
  \@startsection{section}{1}{\z@}%
  {\sectionskip}{0.2ex plus .2ex}%
  {\normalsize\bf}*%
  {\iflmargin
   \vbox{\hbox to \sectionwidth{#1\hfill}\ifline\vskip -0.2\baselineskip%
   \hrule width \sectionwidth \fi}%
   \else #1\fi}}

% Resume environment
\newenvironment{resume}{%
  \begingroup
  \let\olditem\item
  \ifoverlap\else
  \fi
}{%
  \endgroup}

% Format adjustments
\def\@tablebox#1{\begin{tabular}[t]{@{}l@{\extracolsep{\fill}}}#1\end{tabular}}

\newcommand{\employer}[1]{\def\@employer{#1}}
\newcommand{\location}[1]{\def\@location{#1}}
\newcommand{\dates}[1]{\def\@dates{#1}}
\newcommand{\title}[1]{\def\@title{#1}}


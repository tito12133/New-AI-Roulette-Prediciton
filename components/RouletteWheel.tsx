
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { ROULETTE_NUMBERS, NUMBER_COLORS } from '../constants';

interface RouletteWheelProps {
    probabilities: number[];
}

const WHEEL_ORDER = ROULETTE_NUMBERS;

export const RouletteWheel: React.FC<RouletteWheelProps> = ({ probabilities }) => {
    const ref = useRef<SVGSVGElement>(null);
    const size = 400;
    const radius = size / 2;
    const innerRadius = radius * 0.7;
    const numberRadius = radius * 0.85;
    const glowRadius = radius * 1.05;

    useEffect(() => {
        if (!ref.current) return;

        const svg = d3.select(ref.current);
        svg.selectAll('*').remove(); // Clear previous render

        const pie = d3.pie<number>().value(() => 1).sort(null);
        const arc = d3.arc<d3.PieArcDatum<number>>()
            .innerRadius(innerRadius)
            .outerRadius(radius);
        
        const glowArc = d3.arc<d3.PieArcDatum<number>>()
            .innerRadius(innerRadius)
            .outerRadius(glowRadius);
        
        const data = pie(WHEEL_ORDER);
        
        const maxProb = d3.max(probabilities) || 1/37;

        // Color scale for glow
        const glowColorScale = d3.scaleLinear<string>()
            .domain([1/37, maxProb * 0.5, maxProb])
            .range(['#4B5563', '#FBBF24', '#EF4444']) // Gray, Yellow, Red
            .clamp(true);
        
        // Opacity scale for glow
        const glowOpacityScale = d3.scaleLinear()
            .domain([1/37, maxProb])
            .range([0.2, 0.9])
            .clamp(true);

        const g = svg.append('g').attr('transform', `translate(${radius}, ${radius})`);

        // Glow effect definition
        const defs = svg.append('defs');
        const filter = defs.append('filter')
            .attr('id', 'glow');
        filter.append('feGaussianBlur')
            .attr('stdDeviation', '5.5')
            .attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Glow layer
        const glowPaths = g.selectAll('.glow-arc')
            .data(data)
            .join('path')
            .attr('class', 'glow-arc')
            .attr('d', glowArc)
            .style('filter', 'url(#glow)');

        // Main wheel segments
        g.selectAll('.solid-arc')
            .data(data)
            .join('path')
            .attr('class', 'solid-arc')
            .attr('d', arc)
            .attr('fill', d => {
                const num = WHEEL_ORDER[d.index];
                const colorKey = NUMBER_COLORS[num];
                if (colorKey === 'green') return '#16a34a'; // green-600
                if (colorKey === 'red') return '#dc2626'; // red-600
                return '#1f2937'; // gray-800
            })
            .attr('stroke', '#4b5568')
            .attr('stroke-width', 2);

        // Numbers
        g.selectAll('.number-text')
            .data(data)
            .join('text')
            .attr('class', 'number-text')
            .attr('transform', d => `translate(${arc.centroid(d).map(coord => coord * 1.08)})`)
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text(d => WHEEL_ORDER[d.index]);

        // Center piece
        g.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', innerRadius)
            .attr('fill', '#111827') // gray-900
            .attr('stroke', '#6b7280')
            .attr('stroke-width', 3);
        
        // Update glow based on probabilities
        const updateGlows = () => {
             glowPaths.transition()
                .duration(750)
                .attr('fill', d => {
                    const prob = probabilities[WHEEL_ORDER[d.index]];
                    return glowColorScale(prob);
                })
                .attr('opacity', d => {
                    const prob = probabilities[WHEEL_ORDER[d.index]];
                    return glowOpacityScale(prob);
                });
        };

        updateGlows();

    }, [probabilities, radius, innerRadius, glowRadius]);

    return (
        <svg ref={ref} width={size} height={size}></svg>
    );
};
